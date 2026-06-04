import { PrismaClient, Prisma } from "@prisma/client";

import { env } from "./env.js";
import logger from "../utils/logger.js";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl =
  env.NODE_ENV === "test"
    ? (env.TEST_DATABASE_URL ?? env.DATABASE_URL)
    : env.DATABASE_URL;

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },

  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
  ] satisfies Prisma.LogDefinition[],
});

if (env.NODE_ENV === "development") {
  prismaClient.$on("query", (event: Prisma.QueryEvent) => {
    logger.debug({
      query: event.query,
      params: event.params,
      duration: `${event.duration}ms`,
    });
  });
}

export const prisma = globalThis.prisma ?? prismaClient;

if (env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();

    logger.info("Database connected successfully");
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to connect to database",
    );

    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();

    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to disconnect database",
    );
  }
};

export const registerDatabaseShutdown = (): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down database connection...`);

    await disconnectDatabase();

    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

export default prisma;
