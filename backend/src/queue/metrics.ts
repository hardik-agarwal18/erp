
import { Request, Response } from "express";
import { getAggregatedQueueMetrics } from "./monitor.js";
import logger from "../config/logger.js";

export const getQueueMetrics = async (_req: Request, res: Response) => {
  try {
    const metrics = await getAggregatedQueueMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    logger.error({ error }, "Failed to fetch queue metrics");
    res.status(500).json({ error: "Failed to fetch queue metrics" });
  }
};
