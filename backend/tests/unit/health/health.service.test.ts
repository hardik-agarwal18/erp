import { jest } from "@jest/globals";

// Mocking dependencies
import { prisma } from "../../../src/database/prisma.js";
import { checkRedisHealth } from "../../../src/config/redis.js";
import { checkMailHealth } from "../../../src/config/mail.js";
import { storageService } from "../../../src/lib/storage/storage.service.js";
import { queueConnection } from "../../../src/queue/connection.js";

jest.mock("../../../src/database/prisma.js", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock("../../../src/config/redis.js", () => ({
  checkRedisHealth: jest.fn(),
}));

jest.mock("../../../src/config/mail.js", () => ({
  checkMailHealth: jest.fn(),
}));

jest.mock("../../../src/lib/storage/storage.service.js", () => ({
  storageService: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  },
}));

jest.mock("../../../src/queue/connection.js", () => ({
  queueConnection: {
    ping: jest.fn(),
    duplicate: jest.fn().mockReturnThis(),
  },
}));

import {
  checkDatabaseHealth,
  checkStorageHealth,
  checkQueueHealth,
  getSystemHealth,
} from "../../../src/modules/health/health.service.js";

describe("healthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      (checkRedisHealth as jest.Mock).mockResolvedValue(true);
      (checkMailHealth as jest.Mock).mockResolvedValue(true);
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
      (checkRedisHealth as jest.Mock).mockResolvedValue(false);
      (checkMailHealth as jest.Mock).mockResolvedValue(false);
      (storageService.uploadFile as jest.Mock).mockRejectedValue(new Error());
      (queueConnection.ping as jest.Mock).mockRejectedValue(new Error());

      const result = await getSystemHealth();

      expect(result).toEqual({
        database: "error",
        redis: "error",
        mail: "error",
        storage: "error",
        queues: "error",
      });
    });
  });
});
