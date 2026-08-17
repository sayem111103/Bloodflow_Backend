import express from "express";
import { blogController } from "./blog.controller";
import { validation } from "../../middleware/validation";
import { blogValidation } from "./blog.validation";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/client";

const router = express.Router();

// Public reads
router.get("/", blogController.getAllBlogs);
router.get("/get-latest-five", blogController.getLatestFiveBlog);
router.get("/:id", blogController.getBlogById);

// Staff-only writes — ownership enforced in the service layer
router.post(
  "/create-blog",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
  ),
  validation(blogValidation.createBlogSchema),
  blogController.createBlog,
);
router.patch(
  "/:id",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
  ),
  validation(blogValidation.updateBlogSchema),
  blogController.updateBlog,
);
router.delete(
  "/:id",
  auth(
    UserRole.ADMIN,
    UserRole.BLOOD_BANK_MANAGER,
    UserRole.HOSPITAL_REPRESENTATIVE,
  ),
  blogController.deleteBlog,
);

export const blogRoute = router;
