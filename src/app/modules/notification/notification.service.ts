import httpStatus from "http-status";
import AppError from "../../error/AppError.js";
import { prisma } from "../../DB/prisma.js";
import { NotificationStatus } from "../../../generated/client.js";

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

export const notificationServices = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
  notifyDonors,
};
