
import { Request, Response } from "express";
import { getSystemHealth } from "./health.service.js";
import logger from "../../../config/logger.js";

export const getLiveness = (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
};

export const getReadiness = async (_req: Request, res: Response) => {
  try {
    const checks = await getSystemHealth();
    
    const isReady = Object.values(checks).every((status) => status === "ok");

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "error",
      checks,
    });
  } catch (error) {
    logger.error({ error }, "Readiness check failed");
    res.status(503).json({
      status: "error",
      checks: {
        database: "error",
        redis: "error",
        storage: "error",
        queues: "error",
        mail: "error",
      }
    });
  }
};
