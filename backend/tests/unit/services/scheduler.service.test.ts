import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockCleanupQueueAdd = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock("../../../src/queue/queue.service.js", () => ({
  cleanupQueue: { add: mockCleanupQueueAdd },
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { info: mockLoggerInfo, error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: { QUEUE_ENABLED: true, NODE_ENV: "test" },
}));

import { startScheduler } from "../../../src/queue/scheduler.service.js";

describe("scheduler.service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("startScheduler()", () => {
    it("should add a repeatable daily-cleanup job with the correct cron pattern", async () => {
      mockCleanupQueueAdd.mockResolvedValue({ id: "job-1" });

      await startScheduler();

      expect(mockCleanupQueueAdd).toHaveBeenCalledWith(
        "daily-cleanup",
        {},
        expect.objectContaining({
          repeat: { pattern: "0 2 * * *" },
          jobId: "storage-cleanup-job",
        }),
      );
    });

    it("should log that the scheduler is starting", async () => {
      mockCleanupQueueAdd.mockResolvedValue({ id: "job-1" });

      await startScheduler();

      expect(mockLoggerInfo).toHaveBeenCalledWith("Starting background job scheduler...");
    });

    it("should NOT add any job when QUEUE_ENABLED is false", async () => {
      jest.resetModules();

      jest.mock("../../../src/config/env.js", () => ({
        env: { QUEUE_ENABLED: false, NODE_ENV: "test" },
      }));
      jest.mock("../../../src/queue/queue.service.js", () => ({
        cleanupQueue: { add: mockCleanupQueueAdd },
      }));

      const { startScheduler: startSchedulerDisabled } = await import(
        "../../../src/queue/scheduler.service.js"
      );

      await startSchedulerDisabled();

      expect(mockCleanupQueueAdd).not.toHaveBeenCalled();
    });
  });
});
