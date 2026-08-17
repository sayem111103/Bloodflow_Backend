import { prisma } from "../../DB/prisma";
import { BloodGroup } from "../../../generated/client";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import crypto from "crypto";

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};
const otp_ValidityDuration = 30 * 24 * 60 * 60 * 1000;

const createBloodRequest = async (
  requesterId: string,
  payload: {
    bloodGroup: BloodGroup;
    unitsNeeded: number;
    hospital: string;
    state: string;
    district: string;
    town: string;
    address: string;
    neededAt: Date;
  },
) => {
  const result = await prisma.bloodRequest.create({
    data: {
      ...payload,
      requesterId,
    },
  });
  return result;
};

const getAllPendingRequests = async () => {
  const result = await prisma.bloodRequest.findMany({
    where: {
      status: "PENDING",
      isDeleted: false,
    },
    orderBy: { neededAt: "asc" },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
  return result;
};

const getBloodRequestById = async (id: string) => {
  const result = await prisma.bloodRequest.findFirst({
    where: { id, isDeleted: false },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          profile: {
            select: { phoneNumber: true, bloodGroup: true },
          },
        },
      },
    },
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Blood request not found!");
  }
  return result;
};

const acceptBloodRequest = async (
  donorId: string,
  requestId: string,
  unitsDonated: number,
) => {
  const request = await prisma.bloodRequest.findFirst({
    where: { id: requestId, isDeleted: false },
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Blood request not found!");
  }

  if (request.status !== "PENDING") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This request is no longer accepting donations.",
    );
  }

  if (request.requesterId === donorId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't donate to your own request.",
    );
  }

  const existingPending = await prisma.bloodDonationHistory.findFirst({
    where: { donorId, reqId: requestId, status: "IN_PROGRESS" },
  });

  if (existingPending) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have a pending contribution on this request. Wait for it to be confirmed before contributing again.",
    );
  }

  if (unitsDonated > request.unitsNeeded) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only ${request.unitsNeeded} unit(s) still needed for this request.`,
    );
  }

  const donor = await prisma.user.findUnique({ where: { id: donorId } });

  const remaining = request.unitsNeeded - unitsDonated;

  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.bloodDonationHistory.create({
      data: {
        donorId,
        recipientId: request.requesterId,
        reqId: requestId,
        unitDonated: unitsDonated,
        otp: generateOTP(),
        status: "IN_PROGRESS",
        otpExpiresAt: new Date(Date.now() + otp_ValidityDuration),
      },
    });

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        unitsNeeded: remaining,
        status: remaining === 0 ? "IN_PROGRESS" : "PENDING",
      },
    });

    await tx.notification.create({
      data: {
        message: `${donor?.fullName || donor?.username || "A donor"} has offered to donate ${unitsDonated} unit(s) for your blood request.`,
        createdById: donorId,
        sendToId: request.requesterId,
        status: "SPECIFIC",
      },
    });

    return { donation, request: updatedRequest };
  });

  return result;
};

const getVerifyDonationOtp = async (
  donorId: string,
  donationId: string,
  otp: string,
) => {
  const donation = await prisma.bloodDonationHistory.findUnique({
    where: { id: donationId },
  });
  if (!donation)
    throw new AppError(httpStatus.NOT_FOUND, "Contribution not found!");
  if (donation.donorId !== donorId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This isn't your contribution to verify.",
    );
  }
  if (donation.status === "CONFIRMED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This contribution is already verified.",
    );
  }
  if (donation.otpExpiresAt < new Date()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This code has expired. Ask the requester for a new one.",
    );
  }
  if (donation.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Incorrect code.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.bloodDonationHistory.update({
      where: { id: donationId },
      data: { status: "CONFIRMED" },
    });

    const totalCompleted = await tx.bloodDonationHistory.aggregate({
      where: { reqId: donation.reqId, status: "CONFIRMED" },
      _sum: { unitDonated: true },
    });

    const request = await tx.bloodRequest.findUnique({
      where: { id: donation.reqId },
    });
    if (
      request &&
      (totalCompleted._sum.unitDonated ?? 0) >= request.unitsNeeded
    ) {
      await tx.bloodRequest.update({
        where: { id: donation.reqId },
        data: { status: "COMPLETE" },
      });
    }

    return updated;
  });

  return result;
};

const getContributionsForRequest = async (
  requesterId: string,
  requestId: string,
) => {
  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
  });
  if (!request)
    throw new AppError(httpStatus.NOT_FOUND, "Blood request not found!");
  if (request.requesterId !== requesterId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only the requester can view this.",
    );
  }

  return prisma.bloodDonationHistory.findMany({
    where: { reqId: requestId },
    include: {
      donor: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: { donationDate: "desc" },
  });
};

const getMyContribution = async (donorId: string, requestId: string) => {
  return prisma.bloodDonationHistory.findFirst({
    where: { donorId, reqId: requestId },
    orderBy: { donationDate: "desc" },
  });
};

const getCompletedRequestsCount = async () => {
  const count = await prisma.bloodRequest.count({
    where: {
      status: "COMPLETE",
      isDeleted: false,
    },
  });
  return count;
};

const getMyDonations = async (donorId: string) => {
  const result = await prisma.bloodDonationHistory.findMany({
    where: { donorId, status: "CONFIRMED" },
    orderBy: { donationDate: "desc" },
    include: {
      recipient: {
        select: { id: true, username: true, fullName: true },
      },
      bloodRequest: {
        select: {
          id: true,
          hospital: true,
          bloodGroup: true,
          state: true,
          district: true,
          town: true,
        },
      },
    },
  });
  return result;
};

const getMyRequests = async (requesterId: string) => {
  const result = await prisma.bloodRequest.findMany({
    where: { requesterId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      donationHistory: {
        select: {
          id: true,
          donorId: true,
          status: true,
          unitDonated: true,
          donationDate: true,
        },
      },
    },
  });
  return result;
};

const getMyRequestById = async (userId: string, requestId: string) => {
  const request = await prisma.bloodRequest.findFirst({
    where: {
      id: requestId,
      requesterId: userId,
      isDeleted: false,
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      donationHistory: {
        orderBy: {
          donationDate: "desc",
        },
        include: {
          donor: {
            select: {
              id: true,
              username: true,
              fullName: true,
              profile: {
                select: {
                  phoneNumber: true,
                  bloodGroup: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
  }

  return request;
};

const getMyPendingDonations = async (donorId: string) => {
  const result = await prisma.bloodDonationHistory.findMany({
    where: { donorId, status: "IN_PROGRESS" },
    orderBy: { donationDate: "desc" },
    include: {
      recipient: {
        select: { id: true, username: true, fullName: true },
      },
      bloodRequest: {
        select: {
          id: true,
          hospital: true,
          bloodGroup: true,
          state: true,
          district: true,
          town: true,
          status: true,
        },
      },
    },
  });
  return result;
};

const getMyPendingDonationById = async (
  donorId: string,
  donationId: string,
) => {
  const result = await prisma.bloodDonationHistory.findFirst({
    where: {
      id: donationId,
      donorId,
      status: "IN_PROGRESS",
    },
    include: {
      recipient: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profile: {
            select: { phoneNumber: true, bloodGroup: true },
          },
        },
      },
      bloodRequest: {
        select: {
          id: true,
          hospital: true,
          bloodGroup: true,
          state: true,
          district: true,
          town: true,
          address: true,
          unitsNeeded: true,
          status: true,
          neededAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Pending donation not found!");
  }

  return result;
};

const getLatestFiveDonor = async () => {
  const result = await prisma.bloodDonationHistory.findMany({
    where: {},
    orderBy: { donationDate: "desc" },
    take: 5,
    include: {
      donor: {
        include: {
          profile: {
            omit: {
              address: true,
              dateOfBirth: true,
              district: true,
              gender: true,
              guardianNumber: true,
              id: true,
              numberOfDonation: true,
              phoneNumber: true,
              state: true,
              town: true,
            },
          },
        },
        omit: {
          verifyCodeExpiry: true,
          createdAt: true,
          email: true,
          id: true,
          isVerified: true,
          isDeleted: true,
          profileId: true,
          password: true,
          resetPasswordExpiry: true,
          resetPasswordToken: true,
          role: true,
          updatedAt: true,
          status: true,
          verifyCode: true,
          username: true,
        },
      },
    },
    omit: { id: true, otp: true, otpExpiresAt: true },
  });

  return result;
};

export const bloodServices = {
  createBloodRequest,
  getAllPendingRequests,
  getBloodRequestById,
  acceptBloodRequest,
  getCompletedRequestsCount,
  getMyDonations,
  getMyRequests,
  getMyPendingDonations,
  getVerifyDonationOtp,
  getContributionsForRequest,
  getMyContribution,
  getMyPendingDonationById,
  getMyRequestById,
  getLatestFiveDonor,
};
