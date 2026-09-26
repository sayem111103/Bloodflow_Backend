import httpStatus from "http-status";
import AppError from "../../error/AppError";
import { prisma } from "../../DB/prisma";
import { UserRole } from "../../../generated/client";

const createEvent = async (
  organizerId: string,
  payload: {
    title: string;
    description: string;
    location: string;
    coverImage?: string;
    eventDate: Date;
  },
) => {
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: { ...payload, organizerId },
    });

    await tx.notification.create({
      data: {
        message: `New event: "${event.title}" on ${new Date(event.eventDate).toLocaleDateString()} at ${event.location}.`,
        createdById: organizerId,
        status: "EVERYONE",
        link: `/events/${event.id}`,
      },
    });

    return event;
  });

  return result;
};

const getAllEvents = async () => {
  return prisma.event.findMany({
    orderBy: { eventDate: "asc" },
    include: {
      organizer: { select: { id: true, username: true, fullName: true } },
    },
  });
};

const getEventById = async (id: string) => {
  const result = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, username: true, fullName: true } },
    },
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  return result;
};

const assertCanModify = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  if (requesterRole !== UserRole.ADMIN && event.organizerId !== requesterId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only modify your own events.",
    );
  }
  return event;
};

const updateEvent = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
  payload: Partial<{
    title: string;
    description: string;
    location: string;
    coverImage: string;
    eventDate: Date;
  }>,
) => {
  await assertCanModify(id, requesterId, requesterRole);
  return prisma.event.update({ where: { id }, data: payload });
};

const deleteEvent = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  await assertCanModify(id, requesterId, requesterRole);
  await prisma.event.delete({ where: { id } });
  return null;
};

export const eventServices = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
