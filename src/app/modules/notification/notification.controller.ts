import { RequestHandler } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { notificationServices } from "./notification.service.js";

const createNotification: RequestHandler = catchAsync(async (req, res) => {
  const result = await notificationServices.createNotification(
    req.user.id,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Notification sent successfully",
    data: result,
  });
});

const getMyNotifications: RequestHandler = catchAsync(async (req, res) => {
  const result = await notificationServices.getMyNotifications(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const getUnreadCount: RequestHandler = catchAsync(async (req, res) => {
  const result = await notificationServices.getUnreadCount(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Unread count retrieved successfully",
    data: { count: result },
  });
});

const markAsRead: RequestHandler = catchAsync(async (req, res) => {
  const result = await notificationServices.markAsRead(
    req.user.id,
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead: RequestHandler = catchAsync(async (req, res) => {
  await notificationServices.markAllAsRead(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All notifications marked as read",
    data: null,
  });
});

const notifyDonors: RequestHandler = catchAsync(async (req, res) => {
  const count = await notificationServices.notifyDonors(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Notified ${count} donor(s)`,
    data: { count },
  });
});

const cleanupOldNotifications: RequestHandler = catchAsync(async (req, res) => {
  const deletedCount = await notificationServices.deleteOldNotifications();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Deleted ${deletedCount} old notifications`,
    data: { deletedCount },
  });
});

export const notificationController = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  cleanupOldNotifications,
  notifyDonors,
};
