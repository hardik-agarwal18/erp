
import { cleanupQueue } from "./queue.service.js";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

export const startScheduler = async () => {
  if (!env.QUEUE_ENABLED) return;

  logger.info("Starting background job scheduler...");

  // Schedule repeatable cleanup job (runs once a day at midnight)
  await cleanupQueue.add(
    "daily-cleanup",
    {},
    {
      repeat: {
        pattern: "0 2 * * *",
      },
      jobId: "storage-cleanup-job", // Prevent duplicates
    }
  );
};
