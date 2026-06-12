
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const redisUrl =
  env.NODE_ENV === "test"
    ? (env.TEST_REDIS_URL ?? env.REDIS_URL)
    : env.REDIS_URL;

// Shared IORedis connection for BullMQ
export const queueConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

queueConnection.on("error", (error) => {
  logger.error({ error }, "Queue Redis connection error");
});

queueConnection.on("ready", () => {
  logger.info("Queue Redis connected successfully");
});

export const closeQueueConnection = async (): Promise<void> => {
  try {
    await queueConnection.quit();
    logger.info("Queue Redis connection closed");
  } catch (error) {
    logger.error({ error }, "Failed to close Queue Redis connection");
  }
};
