
import "./monitoring/tracing.js";
import app from "./app.js";

import { env } from "./config/env.js";
import prisma from "./config/database.js";

import logger from "./config/logger.js";

import { connectRedis, redisClient } from "./config/redis.js";

import { verifyMailConnection as verifyConnection } from "./config/mail.js";

import { startWorkers, shutdownWorkers } from "./queue/worker.service.js";
import { startScheduler } from "./queue/scheduler.service.js";
import { closeQueues } from "./queue/queue.service.js";
import { closeQueueConnection } from "./queue/connection.js";


let server: ReturnType<typeof app.listen> | undefined;

const startServer = async (): Promise<void> => {

  try {
    // Bind the HTTP port FIRST so Render/cloud platforms detect it immediately
    await new Promise<void>((resolve) => {
      server = app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT}`);
        resolve();
      });
    });

    // Redis
    await connectRedis();
    logger.info("Redis connected");

    // SMTP (non-fatal — log and continue if not configured)
    const smtpReady = await verifyConnection();
    if (!smtpReady) {
      logger.warn("SMTP verification failed — email features will be unavailable");
    }

    // Workers & scheduler
    startWorkers();
    await startScheduler();

    logger.info("All services initialised successfully");
  } catch (error) {
    logger.error({ error }, "Application startup failed");
    process.exit(1);
  }
};

void startServer();


const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }

    await shutdownWorkers();
    await closeQueues();
    await closeQueueConnection();

    await prisma.$disconnect();

    logger.info("Prisma disconnected");

    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info("Redis disconnected");
    }

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Shutdown failed");
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    {
      error: reason,
    },
    "Unhandled Promise Rejection",
  );

  void shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  logger.fatal(
    {
      error,
    },
    "Uncaught Exception",
  );

  void shutdown("UNCAUGHT_EXCEPTION");
});
