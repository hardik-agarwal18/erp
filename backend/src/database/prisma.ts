import { Prisma, PrismaClient } from "@prisma/client";

import { env } from "../config/env.js";

/**
 * Connection and transaction defaults for the shared Prisma client.
 */
const PRISMA_LOG_LEVELS = [
  { emit: "event", level: "query" },
  { emit: "stdout", level: "warn" },
  { emit: "stdout", level: "error" },
] satisfies Prisma.LogDefinition[];

/**
 * Minimal logger facade so the database layer can run independently from any
 * app-specific logger implementation.
 */
import logger from "../config/logger.js";

const databaseLogger = {
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      logger.debug(metadata ?? {}, `[database] ${message}`);
    }
  },
  info(message: string, metadata?: Record<string, unknown>): void {
    logger.info(metadata ?? {}, `[database] ${message}`);
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    logger.error(metadata ?? {}, `[database] ${message}`);
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __globalPrisma__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaShutdownRegistered__: boolean | undefined;
}

/**
 * Builds a Prisma client with environment-aware logging and event hooks.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl =
    env.NODE_ENV === "test"
      ? (env.TEST_DATABASE_URL ?? env.DATABASE_URL)
      : env.DATABASE_URL;

  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: PRISMA_LOG_LEVELS,
  });

  if (process.env.NODE_ENV === "development") {
    client.$on("query", (event: Prisma.QueryEvent) => {
      databaseLogger.debug("Executed Prisma query", {
        durationMs: event.duration,
        params: event.params,
        query: event.query,
        target: event.target,
      });
    });
  }

  client.$on("error", (event) => {
    databaseLogger.error("Prisma engine error", {
      message: event.message,
      target: event.target,
      timestamp: event.timestamp,
    });
  });

  return client;
}

/**
 * Shared Prisma client instance that survives hot reload in development.
 */
export const prisma =
  globalThis.__globalPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__globalPrisma__ = prisma;
}

let connectPromise: Promise<void> | null = null;

/**
 * Opens the shared database connection exactly once per process lifecycle.
 */
export async function connectDatabase(): Promise<void> {
  if (!connectPromise) {
    connectPromise = prisma
      .$connect()
      .then(() => {
        databaseLogger.info("Database connection established");
      })
      .catch((error: unknown) => {
        connectPromise = null;

        databaseLogger.error("Failed to establish database connection", {
          error,
        });

        throw error;
      });
  }

  await connectPromise;
}

/**
 * Closes the Prisma connection pool safely.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    connectPromise = null;
    databaseLogger.info("Database connection closed");
  } catch (error: unknown) {
    databaseLogger.error("Failed to close database connection", {
      error,
    });
    throw error;
  }
}

/**
 * Registers process-level shutdown handlers once to avoid duplicate listeners.
 */
export function registerDatabaseShutdownHooks(): void {
  if (globalThis.__prismaShutdownRegistered__) {
    return;
  }

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    databaseLogger.info("Received shutdown signal", { signal });

    try {
      await disconnectDatabase();
    } catch (error: unknown) {
      databaseLogger.error("Database shutdown encountered an error", {
        error,
        signal,
      });
    } finally {
      process.exit(0);
    }
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  globalThis.__prismaShutdownRegistered__ = true;
}

export default prisma;
