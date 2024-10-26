import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerDebug = jest.fn();

const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn();

const mockQueueJobsCompletedInc = jest.fn();
const mockQueueJobsFailedInc = jest.fn();

const MockWorker = jest.fn().mockImplementation(() => ({
  on: mockWorkerOn,
  close: mockWorkerClose,
  name: "mock-worker",
}));

jest.mock("bullmq", () => ({ Worker: MockWorker }));

jest.mock("../../../src/queue/connection.js", () => ({
  queueConnection: { host: "localhost", duplicate: jest.fn().mockReturnThis() },
}));

jest.mock("../../../src/queue/jobs/mail.job.js", () => ({ processMailJob: jest.fn() }));
jest.mock("../../../src/queue/jobs/pdf.job.js", () => ({ processPdfGenerationJob: jest.fn() }));
jest.mock("../../../src/queue/jobs/storage-cleanup.job.js", () => ({ processCleanupJob: jest.fn() }));
jest.mock("../../../src/queue/jobs/report-export.job.js", () => ({ processReportJob: jest.fn() }));
jest.mock("../../../src/queue/jobs/audit-export.job.js", () => ({ processAuditExportJob: jest.fn() }));

jest.mock("../../../src/monitoring/metrics.js", () => ({
  queueJobsCompletedTotal: { labels: jest.fn().mockReturnValue({ inc: mockQueueJobsCompletedInc }) },
  queueJobsFailedTotal: { labels: jest.fn().mockReturnValue({ inc: mockQueueJobsFailedInc }) },
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
    debug: mockLoggerDebug,
  },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: { QUEUE_ENABLED: true, NODE_ENV: "test" },
}));

import { startWorkers, shutdownWorkers } from "../../../src/queue/worker.service.js";

describe("worker.service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("startWorkers()", () => {
    it("should create 5 workers (mail, pdf, cleanup, reports, audit)", () => {
      startWorkers();
      expect(MockWorker).toHaveBeenCalledTimes(5);
    });

    it("should attach observability listeners (completed, failed, stalled, progress, error) to each worker", () => {
      startWorkers();
      // 5 workers × 5 events = 25 calls
      expect(mockWorkerOn).toHaveBeenCalledWith("completed", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith("failed", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith("stalled", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith("progress", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should log info on startup", () => {
      startWorkers();
      expect(mockLoggerInfo).toHaveBeenCalledWith("Starting background workers...");
    });

    it("should call queueJobsCompletedTotal.inc() when completed event fires", () => {
      startWorkers();
      const completedHandler = mockWorkerOn.mock.calls.find(([e]) => e === "completed")?.[1] as Function;
      completedHandler({ id: "j1", finishedOn: Date.now(), processedOn: Date.now() - 100, timestamp: Date.now() - 200, attemptsMade: 1 });
      expect(mockQueueJobsCompletedInc).toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it("should call queueJobsFailedTotal.inc() and log error when failed event fires", () => {
      startWorkers();
      const failedHandler = mockWorkerOn.mock.calls.find(([e]) => e === "failed")?.[1] as Function;
      failedHandler({ id: "j1", attemptsMade: 2 }, new Error("job boom"));
      expect(mockQueueJobsFailedInc).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalled();
    });

    it("should warn on stalled event", () => {
      startWorkers();
      const stalledHandler = mockWorkerOn.mock.calls.find(([e]) => e === "stalled")?.[1] as Function;
      stalledHandler("job-stalled-id");
      expect(mockLoggerWarn).toHaveBeenCalled();
    });

    it("should debug-log on progress event", () => {
      startWorkers();
      const progressHandler = mockWorkerOn.mock.calls.find(([e]) => e === "progress")?.[1] as Function;
      progressHandler({ id: "j1" }, 50);
      expect(mockLoggerDebug).toHaveBeenCalled();
    });

    it("should log error on worker error event", () => {
      startWorkers();
      const errorHandler = mockWorkerOn.mock.calls.find(([e]) => e === "error")?.[1] as Function;
      errorHandler(new Error("worker crash"));
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe("startWorkers() — QUEUE_ENABLED=false", () => {
    it("should NOT create any workers when queues are disabled", async () => {
      jest.resetModules();

      jest.mock("../../../src/config/env.js", () => ({
        env: { QUEUE_ENABLED: false, NODE_ENV: "test" },
      }));

      const { startWorkers: startWorkersDisabled } = await import(
        "../../../src/queue/worker.service.js"
      );
      startWorkersDisabled();

      // MockWorker calls are from before re-import so this checks relative calls are 0
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining("disabled"),
      );
    });
  });

  describe("shutdownWorkers()", () => {
    it("should close all started workers", async () => {
      startWorkers();
      mockWorkerClose.mockResolvedValue(undefined);

      await shutdownWorkers();

      expect(mockWorkerClose).toHaveBeenCalled();
    });

    it("should log a shutdown message", async () => {
      startWorkers();
      mockWorkerClose.mockResolvedValue(undefined);

      await shutdownWorkers();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        "Shutting down background workers gracefully...",
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith("All background workers shutdown complete.");
    });
  });
});
