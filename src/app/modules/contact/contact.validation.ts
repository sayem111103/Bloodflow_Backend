import { z } from "zod";

const createMessageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("A valid email is required"),
    message: z.string().trim().min(1, "Message is required").max(5000),
  }),
});

export const contactValidation = { createMessageSchema };
