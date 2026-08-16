import express from "express";
import { notificationController } from "./notification.controller.js";
import { validation } from "../../middleware/validation.js";
import { notificationValidation } from "./notification.validation.js";
import auth from "../../middleware/auth.js";
import { UserRole } from "../../../generated/client.js";
import cronAuth from "../../middleware/cronAuth.js";


const router = express.Router();

const ALL_ROLES = [
  UserRole.ADMIN,
  UserRole.BLOOD_BANK_MANAGER,
  UserRole.HOSPITAL_REPRESENTATIVE,
  UserRole.USER,
];

router.post(
  "/create-notification",
  auth(UserRole.ADMIN),
  validation(notificationValidation.createNotificationSchema),
  notificationController.createNotification,
);
router.get("/", auth(...ALL_ROLES), notificationController.getMyNotifications);
router.get(
  "/unread-count",
  auth(...ALL_ROLES),
  notificationController.getUnreadCount,
);
router.patch(
  "/:id/read",
  auth(...ALL_ROLES),
  notificationController.markAsRead,
);
router.patch(
  "/mark-all-read",
  auth(...ALL_ROLES),
  notificationController.markAllAsRead,
);

router.post(
  "/notify-donors",
  auth(...ALL_ROLES),
  validation(notificationValidation.notifyDonorsSchema),
  notificationController.notifyDonors,
);

router.get(
  "/cleanup",
  cronAuth,
  notificationController.cleanupOldNotifications,
);

export const notificationRoute = router;
