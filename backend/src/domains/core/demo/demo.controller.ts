
import { Request, Response } from "express";
import { demoService } from "./demo.service.js";
import logger from "../../../config/logger.js";

export const demoController = {
  seedDemo: async (req: Request, res: Response) => {
    try {
      const result = await demoService.seedDemoEnvironment();
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("SEED DEMO ERROR:", error);
      logger.error({ error }, "Failed to seed demo environment");
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed",
      });
    }
  },
};
