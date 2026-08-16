import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../error/AppError.js";

const cronAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized cron request.");
  }
  next();
};

export default cronAuth;
