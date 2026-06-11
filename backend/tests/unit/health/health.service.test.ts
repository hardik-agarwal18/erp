import { jest } from "@jest/globals";

// Import dependencies
import { prisma } from "../../../src/database/prisma.js";
import { redisClient } from "../../../src/config/redis.js";
import { transporter } from "../../../src/config/mail.js";
import { storageService } from "../../../src/lib/storage/storage.service.js";
import { queueConnection } from "../../../src/queue/connection.js";
import { env } from "../../../src/config/env.js";

import {
  checkDatabaseHealth,
  checkStorageHealth,
  checkQueueHealth,
  getSystemHealth,
} from "../../../src/modules/health/health.service.js";

describe("healthService", () => {

  let originals: any = {};

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save originals
    originals.queryRaw = prisma.$queryRaw;
    originals.redisPing = redisClient.ping;
    originals.verify = transporter.verify;
    originals.uploadFile = storageService.uploadFile;
    originals.deleteFile = storageService.deleteFile;
    originals.queuePing = queueConnection.ping;

    // Mutate methods directly to avoid jest.spyOn OOM on complex classes
    prisma.$queryRaw = jest.fn() as any;
    redisClient.ping = jest.fn() as any;
    transporter.verify = jest.fn() as any;
    storageService.uploadFile = jest.fn() as any;
    storageService.deleteFile = jest.fn() as any;
    queueConnection.ping = jest.fn() as any;
  });

  afterEach(() => {
    // Restore originals
    prisma.$queryRaw = originals.queryRaw;
    redisClient.ping = originals.redisPing;
    transporter.verify = originals.verify;
    storageService.uploadFile = originals.uploadFile;
    storageService.deleteFile = originals.deleteFile;
    queueConnection.ping = originals.queuePing;
  });

  describe("checkDatabaseHealth", () => {
    it("should return true if db is ok", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(1);
      const result = await checkDatabaseHealth();
      expect(result).toBe(true);
    });

    it("should return false if db query fails", async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("DB Error"));
      const result = await checkDatabaseHealth();
      expect(result).toBe(false);
    });
  });

  describe("checkStorageHealth", () => {
    it("should return true if storage is ok", async () => {
      (storageService.uploadFile as jest.Mock).mockResolvedValue(undefined);
      (storageService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      const result = await checkStorageHealth();
      expect(result).toBe(true);
    });

    it("should return false if storage fails", async () => {
      (storageService.uploadFile as jest.Mock).mockRejectedValue(new Error("Storage Error"));
      const result = await checkStorageHealth();
      expect(result).toBe(false);
    });
  });

  describe("checkQueueHealth", () => {
    it("should return true if queue responds with PONG", async () => {
      (queueConnection.ping as jest.Mock).mockResolvedValue("PONG");
      const result = await checkQueueHealth();
      expect(result).toBe(true);
    });

    it("should return false if queue fails", async () => {
      (queueConnection.ping as jest.Mock).mockRejectedValue(new Error("Queue Error"));
      const result = await checkQueueHealth();
      expect(result).toBe(false);
    });
  });

  describe("getSystemHealth", () => {
    it("should return aggregated health status", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(1);
      (redisClient.ping as jest.Mock).mockResolvedValue("PONG");
      
      // Mail health always returns true in test env
      
      (storageService.uploadFile as jest.Mock).mockResolvedValue(undefined);
      (storageService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (queueConnection.ping as jest.Mock).mockResolvedValue("PONG");

      const result = await getSystemHealth();

      expect(result).toEqual({
        database: "ok",
        redis: "ok",
        mail: "ok",
        storage: "ok",
        queues: "ok",
      });
    });

    it("should return error for failing components", async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error());
      (redisClient.ping as jest.Mock).mockRejectedValue(new Error());
      
      // Mail health always returns true in test env
      
      (storageService.uploadFile as jest.Mock).mockRejectedValue(new Error());
      (queueConnection.ping as jest.Mock).mockRejectedValue(new Error());

      const result = await getSystemHealth();

      expect(result).toEqual({
        database: "error",
        redis: "error",
        mail: "ok", // because env.NODE_ENV === "test" bypasses the check
        storage: "error",
        queues: "error",
      });
    });
  });
});
