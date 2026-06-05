import { prisma } from "../../database/prisma.js";
import { checkRedisHealth } from "../../redis/redisClient.js";
import { storageService } from "../../lib/storage/storage.service.js";
import { queueConnection } from "../../queue/connection.js";

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};

export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    // Write and delete a small temp file to verify storage
    const testPath = `health-check-${Date.now()}.txt`;
    await storageService.uploadFile(testPath, Buffer.from("ok"));
    await storageService.deleteFile(testPath);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkQueueHealth = async (): Promise<boolean> => {
  try {
    const response = await queueConnection.ping();
    return response === "PONG";
  } catch (error) {
    return false;
  }
};

export const getSystemHealth = async () => {
  const [database, redis, storage, queues] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkStorageHealth(),
    checkQueueHealth(),
  ]);

  return {
    database: database ? "ok" : "error",
    redis: redis ? "ok" : "error",
    storage: storage ? "ok" : "error",
    queues: queues ? "ok" : "error",
  };
};
