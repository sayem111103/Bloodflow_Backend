import express from "express";
import { contactController } from "./contact.controller";
import { validation } from "../../middleware/validation";
import { contactValidation } from "./contact.validation";
import { contactFormLimiter } from "../../middleware/rateLimiter";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/client";

const router = express.Router();

// Public — anyone can submit the contact form, no auth required.
router.post(
  "/",
  contactFormLimiter,
  validation(contactValidation.createMessageSchema),
  contactController.createMessage,
);

// Staff-only — review submitted messages.
router.get(
  "/",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
  ),
  contactController.getAllMessages,
);

export const contactRoute = router;
