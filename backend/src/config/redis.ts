
import { createClient, RedisClientType } from "redis";

import { env } from "./env.js";
import logger from "./logger.js";

const redisUrl =
  env.NODE_ENV === "test"
    ? (env.TEST_REDIS_URL ?? env.REDIS_URL)
    : env.REDIS_URL;

export const redisClient: RedisClientType = createClient({
  url: redisUrl,

  socket: {
    reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000),
  },
});

redisClient.on("connect", () => {
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis connected");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

redisClient.on("error", (error) => {
  logger.error(
    {
      error,
    },
    "Redis error",
  );
});

redisClient.on("end", () => {
  logger.warn("Redis connection closed");
});

/**
 * Connect Redis
 */
export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    logger.info("Redis connection established");
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to connect Redis",
    );

    process.exit(1);
  }
};

/**
 * Disconnect Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    logger.info("Redis disconnected");
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to disconnect Redis",
    );
  }
};

/**
 * Redis Health Check
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const response = await redisClient.ping();

    return response === "PONG";
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Redis health check failed",
    );

    return false;
  }
};

/**
 * Graceful Shutdown
 */
export const registerRedisShutdown = (): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Closing Redis connection...`);

    await disconnectRedis();

    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

export default redisClient;
