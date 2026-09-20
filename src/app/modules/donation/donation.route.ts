import express from "express";
import { donationController } from "./donation.controller";
import { validation } from "../../middleware/validation";
import { donationValidation } from "./donation.validation";
import { donationInitiateLimiter } from "../../middleware/rateLimiter";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/client";

const router = express.Router();

router.post(
  "/initiate",
  auth(),
  donationInitiateLimiter,
  validation(donationValidation.initiateDonationSchema),
  donationController.initiateDonation,
);
router.post("/success", donationController.success);
router.post("/fail", donationController.fail);
router.post("/cancel", donationController.cancel);
router.post("/ipn", donationController.ipn);
router.get("/me", auth(), donationController.getMyDonations);
router.get(
  "/",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
  ),
  donationController.getAllDonations,
);

export const donationRoute = router;
