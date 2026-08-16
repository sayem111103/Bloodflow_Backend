import { Router } from "express";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/enums";

const router = Router();
router.post(
  "/create",
  auth(
    UserRole.ADMIN,
    UserRole.HOSPITAL_REPRESENTATIVE,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.USER,
  ),
);

export const notificationRoutes = router;
