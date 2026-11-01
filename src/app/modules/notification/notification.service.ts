import httpStatus from "http-status";
import AppError from "../../error/AppError.js";
import { prisma } from "../../DB/prisma.js";
import { NotificationStatus } from "../../../generated/client.js";
import { BloodGroup } from "../../../generated/client.js";
import { config } from "../../config/config.js";

const createNotification = async (
  createdById: string,
  payload: { message: string; status: NotificationStatus; sendToId?: string },
) => {
  return prisma.notification.create({
    data: { ...payload, createdById },
  });
};

const getMyNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ status: "EVERYONE" }, { status: "SPECIFIC", sendToId: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      reads: { where: { userId } },
      createdBy: { select: { id: true, username: true, fullName: true } },
    },
  });
  return notifications.map((n) => {
    const { reads, ...rest } = n;
    return { ...rest, isRead: reads.length > 0 };
  });
};

const getUnreadCount = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ status: "EVERYONE" }, { status: "SPECIFIC", sendToId: userId }],
    },
    select: {
      id: true,
      reads: { where: { userId }, select: { id: true } },
    },
  });
  return notifications.filter((n) => n.reads.length === 0).length;
};

const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [{ status: "EVERYONE" }, { status: "SPECIFIC", sendToId: userId }],
    },
  });
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");
  }

  return prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId, userId } },
    update: {},
    create: { notificationId, userId },
  });
};

const markAllAsRead = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ status: "EVERYONE" }, { status: "SPECIFIC", sendToId: userId }],
    },
    select: { id: true },
  });

  await prisma.notificationRead.createMany({
    data: notifications.map((n) => ({ notificationId: n.id, userId })),
    skipDuplicates: true,
  });

  return null;
};

const notifyDonors = async (
  senderId: string,
  payload: { message: string; donorIds: string[] },
) => {
  const notifications = await prisma.notification.createMany({
    data: payload.donorIds.map((donorId) => ({
      message: payload.message,
      createdById: senderId,
      sendToId: donorId,
      status: "SPECIFIC" as const,
    })),
  });
  return notifications.count;
};

const deleteOldNotifications = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: oneMonthAgo } },
  });
  return result.count;
};

const normalizeArea = (value?: string) =>
  value?.replace(/\b(district|division|zila|zilla)\b/gi, "").trim() ||
  undefined;

const reverseGeocode = async (lat: number, lng: number) => {
  const q = encodeURIComponent(`${lat},${lng}`);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${q}&key=${config.opencage_api_key}&language=en&limit=1&no_annotations=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Location service is unavailable.",
    );
  }
  const json = (await res.json()) as any;
  const c = json?.results?.[0]?.components;
  if (!c) {
    throw new AppError(httpStatus.NOT_FOUND, "Couldn't work out your area.");
  }

  return {
    state: normalizeArea(c.state),
    district: normalizeArea(c.state_district || c.county || c.city),
    town: (c.suburb || c.neighbourhood || c.town || c.city || c.village) as
      string | undefined,
  };
};

const notifyNearbyDonors = async (
  senderId: string,
  payload: {
    latitude: number;
    longitude: number;
    bloodGroup: BloodGroup;
    requestId?: string;
    message?: string;
  },
) => {
  const area = await reverseGeocode(payload.latitude, payload.longitude);
  console.log("Reverse geocoded area:", area);
  if (!area.district) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Couldn't work out your district.",
    );
  }

  const donors = await prisma.user.findMany({
    where: {
      id: { not: senderId },
      role: "USER",
      isDeleted: false,
      isVerified: true,
      status: "ACTIVE",
      profile: {
        bloodGroup: payload.bloodGroup,
        district: { contains: area.district, mode: "insensitive" },
      },
    },
    select: { id: true },
    take: 50,
  });
  donors.forEach((donor) => {
    console.log(
      `Notification created for donor ${donor.id} with message: ${message}`,
    );
  });
  if (donors.length === 0) return { notified: 0, area };

  const label = payload.bloodGroup.replace("_POS", "+").replace("_NEG", "-");
  const message =
    payload.message ??
    `Urgent: ${label} blood is needed near ${area.town ?? area.district}. Please help if you can.`;
  console.log(`Notifying ${donors.length} donors:`, message);  

  await prisma.notification.createMany({
    data: donors.map((d) => ({
      message,
      createdById: senderId,
      sendToId: d.id,
      status: "SPECIFIC" as const,
      link: payload.requestId ? `/requests/${payload.requestId}` : null,
    })),
  });

  return { notified: donors.length, area };
};
export const notificationServices = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
  notifyDonors,
  notifyNearbyDonors,
};
