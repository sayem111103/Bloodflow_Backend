import { z } from "zod";
import { NotificationStatus } from "../../../generated/client.js";

const createNotificationSchema = z.object({
  body: z
    .object({
      message: z.string().min(1),
      status: z.nativeEnum(NotificationStatus),
      sendToId: z.string().uuid().optional(),
    })
    .refine(
      (data) => data.status !== NotificationStatus.SPECIFIC || !!data.sendToId,
      {
        message: "sendToId is required when status is SPECIFIC",
        path: ["sendToId"],
      },
    ),
});

const notifyDonorsSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(300),
    donorIds: z.array(z.string().uuid()).min(1).max(50),
  }),
});


export const notificationValidation = { 
    createNotificationSchema,
    notifyDonorsSchema 
};
