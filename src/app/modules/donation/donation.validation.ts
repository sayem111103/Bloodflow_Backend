import { z } from "zod";

const initiateDonationSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive().min(10, "Minimum donation is 10 BDT"),
    note: z.string().trim().max(500).optional(),
    donorName: z.string().trim().min(1).optional(),
    donorEmail: z.string().trim().email().optional(),
    donorPhone: z.string().trim().min(1).optional(),
  }),
});

export const donationValidation = { initiateDonationSchema };
