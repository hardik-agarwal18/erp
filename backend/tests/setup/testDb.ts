import { Prisma } from "@prisma/client";

import { env } from "../../src/config/env.js";
import prisma from "../../src/config/database.js";
import { redisClient } from "../../src/config/redis.js";

const ensureSafeTestTarget = () => {
  const databaseUrl = env.TEST_DATABASE_URL ?? env.DATABASE_URL;
  const redisUrl = env.TEST_REDIS_URL ?? env.REDIS_URL;

  if (env.NODE_ENV !== "test") {
    throw new Error("Refusing to run test helpers outside NODE_ENV=test");
  }

  if (!/test/i.test(databaseUrl) && !/prisma\.io/i.test(databaseUrl)) {
    throw new Error(
      `Refusing to use a non-test database URL in tests: ${databaseUrl}`,
    );
  }

  if (!/\/\d+$/.test(redisUrl) && !/test/i.test(redisUrl) && !/upstash\.io/i.test(redisUrl)) {
    throw new Error(
      `Refusing to use a non-isolated Redis URL in tests: ${redisUrl}`,
    );
  }
};

export const connectTestInfrastructure = async () => {
  ensureSafeTestTarget();
  await prisma.$connect();
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const clearDatabase = async () => {
  ensureSafeTestTarget();

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>(
    Prisma.sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
    `,
  );

  if (tables.length === 0) {
    return;
  }

  const quotedTables = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`,
  );
};

export const clearRedis = async () => {
  ensureSafeTestTarget();
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  await redisClient.flushDb();
};

export const resetTestState = async () => {
  await clearRedis();
  await clearDatabase();
};

export const disconnectTestInfrastructure = async () => {
  const { closeQueues } = await import("../../src/queue/queue.service.js");
  const { closeQueueConnection } = await import("../../src/queue/connection.js");
  await closeQueues();
  await closeQueueConnection();

  if (redisClient.isOpen) {
    await redisClient.quit();
  }

  await prisma.$disconnect();
};

export { prisma, redisClient };
