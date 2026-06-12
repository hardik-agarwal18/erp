// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export const metricsAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-metrics-token"];
  if (!env.METRICS_SECRET || token !== env.METRICS_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};
