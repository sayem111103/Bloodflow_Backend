import { RequestHandler } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { donationServices } from "./donation.service";
import type { SSLCommerzCallbackPayload } from "../../lib/sslcommerz/types";

const initiateDonation: RequestHandler = catchAsync(async (req, res) => {
  const result = await donationServices.createDonation(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment session created",
    data: result,
  });
});

const success: RequestHandler = catchAsync(async (req, res) => {
  const redirectUrl = await donationServices.handleRedirectCallback(
    "success",
    req.body as SSLCommerzCallbackPayload,
  );
  res.redirect(302, redirectUrl);
});

const fail: RequestHandler = catchAsync(async (req, res) => {
  const redirectUrl = await donationServices.handleRedirectCallback(
    "fail",
    req.body as SSLCommerzCallbackPayload,
  );
  res.redirect(302, redirectUrl);
});

const cancel: RequestHandler = catchAsync(async (req, res) => {
  const redirectUrl = await donationServices.handleRedirectCallback(
    "cancel",
    req.body as SSLCommerzCallbackPayload,
  );
  res.redirect(302, redirectUrl);
});

const ipn: RequestHandler = catchAsync(async (req, res) => {
  const result = await donationServices.handleIpn(
    req.body as SSLCommerzCallbackPayload,
  );
  res.status(httpStatus.OK).json(result);
});

const getMyDonations: RequestHandler = catchAsync(async (req, res) => {
  const result = await donationServices.getMyDonations(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your donations retrieved successfully",
    data: result,
  });
});

const getAllDonations: RequestHandler = catchAsync(async (req, res) => {
  const result = await donationServices.getAllDonations();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donations retrieved successfully",
    data: result,
  });
});

export const donationController = {
  initiateDonation,
  success,
  fail,
  cancel,
  ipn,
  getMyDonations,
  getAllDonations,
};
