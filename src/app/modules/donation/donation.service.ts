import { prisma } from "../../DB/prisma";
import { config } from "../../config/config";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import {
  initiatePayment,
  validatePaymentByValId,
} from "../../lib/sslcommerz/payment";
import { verifyIpnSignature } from "../../lib/sslcommerz/ipn";
import type { SSLCommerzCallbackPayload } from "../../lib/sslcommerz/types";

type InitiateDonationPayload = {
  amount: number;
  note?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
};

const requireSslConfig = () => {
  if (!config.ssl.store_id || !config.ssl.store_passwd) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Payment gateway is not configured. Please contact the site administrator.",
    );
  }
  if (!config.backend_url || !config.origin) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Server URLs are not configured. Please contact the site administrator.",
    );
  }
};

const createDonation = async (
  userId: string,
  payload: InitiateDonationPayload,
) => {
  requireSslConfig();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found!");

  const donorName = payload.donorName?.trim() || user.fullName || user.username;
  const donorEmail = payload.donorEmail?.trim() || user.email;
  const donorPhone =
    payload.donorPhone?.trim() || user.profile?.phoneNumber || "N/A";

  const tranId = `DON_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const donation = await prisma.moneyDonation.create({
    data: {
      userId,
      donorName,
      donorEmail,
      donorPhone,
      amount: payload.amount,
      note: payload.note,
      tranId,
      status: "PENDING",
    },
  });

  const backendBase = config.backend_url as string;

  try {
    const sslResponse = await initiatePayment(
      {
        store_id: config.ssl.store_id as string,
        store_passwd: config.ssl.store_passwd as string,
        total_amount: payload.amount,
        currency: "BDT",
        tran_id: tranId,
        success_url: `${backendBase}/api/v1/donations/success`,
        fail_url: `${backendBase}/api/v1/donations/fail`,
        cancel_url: `${backendBase}/api/v1/donations/cancel`,
        ipn_url: `${backendBase}/api/v1/donations/ipn`,
        product_name: "Blood Flow Donation",
        product_category: "donation",
        product_profile: "general",
        shipping_method: "NO",
        cus_name: donorName,
        cus_email: donorEmail,
        cus_add1: "N/A",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: donorPhone,
        value_a: donation.id,
        value_b: tranId,
      },
      config.ssl.env,
    );

    if (sslResponse.status !== "SUCCESS" || !sslResponse.GatewayPageURL) {
      await prisma.moneyDonation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        sslResponse.failedreason ?? "Payment gateway rejected the request.",
      );
    }

    await prisma.moneyDonation.update({
      where: { id: donation.id },
      data: { status: "PROCESSING", sessionKey: sslResponse.sessionkey },
    });

    return {
      GatewayPageURL: sslResponse.GatewayPageURL,
      donationId: donation.id,
      tranId,
    };
  } catch (err) {
    await prisma.moneyDonation.update({
      where: { id: donation.id },
      data: { status: "FAILED" },
    });
    if (err instanceof AppError) throw err;
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Payment gateway unreachable. Please try again.",
    );
  }
};

const confirmDonation = async (valId: string, tranId: string) => {
  const donation = await prisma.moneyDonation.findUnique({ where: { tranId } });
  if (!donation) return null;
  if (donation.status === "PAID") return donation;

  const validation = await validatePaymentByValId(
    valId,
    config.ssl.store_id as string,
    config.ssl.store_passwd as string,
    config.ssl.env,
  );

  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    await prisma.moneyDonation.update({
      where: { tranId },
      data: { status: "FAILED" },
    });
    return null;
  }

  return prisma.moneyDonation.update({
    where: { tranId },
    data: {
      status: "PAID",
      valId,
      bankTranId: validation.bank_tran_id,
      cardType: validation.card_type,
    },
  });
};

const handleRedirectCallback = async (
  outcome: "success" | "fail" | "cancel",
  payload: SSLCommerzCallbackPayload,
) => {
  const tranId = payload.tran_id;
  if (!tranId) return `${config.origin}/donate/fail`;

  if (outcome === "success" && payload.val_id) {
    const confirmed = await confirmDonation(payload.val_id, tranId);
    return confirmed
      ? `${config.origin}/donate/success?tran_id=${tranId}`
      : `${config.origin}/donate/fail?tran_id=${tranId}`;
  }

  await prisma.moneyDonation.updateMany({
    where: { tranId, status: { not: "PAID" } },
    data: { status: outcome === "cancel" ? "CANCELLED" : "FAILED" },
  });

  return `${config.origin}/donate/${outcome}?tran_id=${tranId}`;
};

const handleIpn = async (payload: SSLCommerzCallbackPayload) => {
  if (payload.status !== "VALID")
    return { valid: false, reason: `Transaction status is ${payload.status}` };
  if (!verifyIpnSignature(payload, config.ssl.store_passwd as string))
    return { valid: false, reason: "IPN signature mismatch" };
  if (!payload.tran_id || !payload.val_id)
    return { valid: false, reason: "Missing tran_id/val_id" };

  const confirmed = await confirmDonation(payload.val_id, payload.tran_id);
  return confirmed
    ? { valid: true }
    : { valid: false, reason: "Validation API rejected transaction" };
};

const getMyDonations = async (userId: string) =>
  prisma.moneyDonation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

const getAllDonations = async () =>
  prisma.moneyDonation.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true, email: true } } },
  });

  
export const donationServices = {
  createDonation,
  handleRedirectCallback,
  handleIpn,
  getMyDonations,
  getAllDonations,
};
