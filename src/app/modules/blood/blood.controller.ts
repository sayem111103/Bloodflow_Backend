import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { bloodServices } from "./blood.service";

const createBloodRequest: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.createBloodRequest(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Blood request created successfully",
    data: result,
  });
});

const BloodRequest: RequestHandler = catchAsync(async (req, res) => {
  const data = req.user;
  const result = await bloodServices.getAllPendingRequests();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Requests retrieved successfully",
    data: result,
  });
});

const getBloodRequestById = catchAsync(async (req, res) => {
  const result = await bloodServices.getBloodRequestById(
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blood request fetched successfully",
    data: result,
  });
});

const acceptBloodRequest: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.acceptBloodRequest(
    req.user.id,
    req.params.id as string,
    req.body.units,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contribution accepted successfully",
    data: result,
  });
});

const verifyDonationOtp = catchAsync(async (req, res) => {
  const result = await bloodServices.getVerifyDonationOtp(
    req.user.id,
    req.body.donationId,
    req.body.otp,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donation verified successfully",
    data: result,
  });
});

const getContributionsForRequest = catchAsync(async (req, res) => {
  const result = await bloodServices.getContributionsForRequest(
    req.user.id,
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contributions retrieved successfully",
    data: result,
  });
});

const getMyContribution = catchAsync(async (req, res) => {
  const result = await bloodServices.getMyContribution(
    req.user.id,
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contribution status retrieved",
    data: result,
  });
});

const getCompletedRequestsCount = catchAsync(async (req, res) => {
  const result = await bloodServices.getCompletedRequestsCount();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Completed requests count retrieved successfully",
    data: { count: result },
  });
});

const getMyDonations: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.getMyDonations(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your completed donations retrieved successfully",
    data: result,
  });
});

const getMyRequests: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.getMyRequests(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your blood requests retrieved successfully",
    data: result,
  });
});

const getMyRequestById = catchAsync(async (req, res) => {
  const result = await bloodServices.getMyRequestById(
    req.user.id,
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blood request retrieved successfully",
    data: result,
  });
});

const getMyPendingDonations: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.getMyPendingDonations(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your pending donations retrieved successfully",
    data: result,
  });
});

const getMyPendingDonationById: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await bloodServices.getMyPendingDonationById(
      req.user.id,
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pending donation retrieved successfully",
      data: result,
    });
  },
);

const getLatestFive: RequestHandler = catchAsync(async (req, res) => {
  const result = await bloodServices.getLatestFiveDonor();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "get latest blood donor retrieved successfully",
    data: result,
  });
});

export const bloodController = {
  BloodRequest,
  getBloodRequestById,
  createBloodRequest,
  acceptBloodRequest,
  getCompletedRequestsCount,
  getMyDonations,
  getMyRequests,
  getMyPendingDonations,
  verifyDonationOtp,
  getContributionsForRequest,
  getMyContribution,
  getMyPendingDonationById,
  getMyRequestById,
  getLatestFive,
};
