import { RequestHandler } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { contactServices } from "./contact.service";

const createMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactServices.createMessage(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Message sent successfully",
    data: result,
  });
});

const getAllMessages: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactServices.getAllMessages();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Messages retrieved successfully",
    data: result,
  });
});

export const contactController = { createMessage, getAllMessages };
