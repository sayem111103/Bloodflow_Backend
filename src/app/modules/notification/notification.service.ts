import { Prisma } from "../../../generated/client";
import { prisma } from "../../DB/prisma";

const create = async (payload: Prisma.NotificationCreateInput) => {
  const result = await prisma.notification.create({ data: payload });
};
