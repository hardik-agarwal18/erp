// @ts-nocheck
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const createApiRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  enabled?: boolean;
}) => {
  const isEnabled = options?.enabled ?? env.RATE_LIMIT_ENABLED;
  if (!isEnabled) {
    return (req: any, res: any, next: any) => next();
  }
  return rateLimit({
    windowMs: options?.windowMs ?? env.RATE_LIMIT_WINDOW * 60 * 1000,
    max: options?.max ?? env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  });
};

export const apiRateLimiter = createApiRateLimiter();
