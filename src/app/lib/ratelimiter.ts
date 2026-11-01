import rateLimit from "express-rate-limit";

export const nearbyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  keyGenerator: (req) => (req as any).user.id, // runs after auth()
  message: {
    success: false,
    message: "Too many alerts. Try again in a few minutes.",
  },
});
