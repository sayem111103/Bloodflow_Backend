import express from "express";
import { validation } from "../../middleware/validation.js";
import auth from "../../middleware/auth.js";
import { UserRole } from "../../../generated/enums.js";
import { bloodRequestValidation } from "./blood.validation.js";
import { bloodController } from "./blood.controller.js";

const router = express.Router();

router.get("/pending", bloodController.BloodRequest);

router.get("/completed-count", bloodController.getCompletedRequestsCount);

router.get(
  "/my-donations",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyDonations,
);

router.get(
  "/my-requests",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyRequests,
);

router.get(
  "/my-pending-donations",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyPendingDonations,
);

router.post(
  "/create-request",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  validation(bloodRequestValidation.createBloodRequestSchema),
  bloodController.createBloodRequest,
);

router.post(
  "/verify-otp",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.verifyDonationOtp,
);

router.get(
  "/my-pending-donations/:id",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyPendingDonationById,
);

router.get(
  "/my-request/:id",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyRequestById,
);

router.get(
  "/:id/contributions",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getContributionsForRequest,
);
router.get(
  "/:id/my-contribution",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  bloodController.getMyContribution,
);

router.post(
  "/:id/accept",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.USER,
  ),
  validation(bloodRequestValidation.acceptDonationSchema),
  bloodController.acceptBloodRequest,
);

router.get("/:id/get-single", bloodController.getBloodRequestById);
router.get("/get-latest-five", bloodController.getLatestFive);

export const bloodRequestRoute = router;
