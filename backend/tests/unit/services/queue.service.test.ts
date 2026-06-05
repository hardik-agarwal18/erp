import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

// Capture queue instances and their event handlers when constructed
const capturedOnCalls: [string, Function][] = [];
const capturedInstances: any[] = [];

const mockQueueClose = jest.fn();

const MockQueue = jest.fn().mockImplementation((name: string) => {
  const instance = {
    name,
    on: jest.fn((event: string, handler: Function) => {
      capturedOnCalls.push([event, handler]);
    }),
    close: mockQueueClose,
    add: jest.fn(),
  };
  capturedInstances.push(instance);
  return instance;
});

jest.mock("bullmq", () => ({ Queue: MockQueue }));

jest.mock("../../../src/queue/connection.js", () => ({
  queueConnection: { host: "localhost", port: 6379 },
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { info: mockLoggerInfo, error: mockLoggerError, warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: { QUEUE_ENABLED: true, NODE_ENV: "test" },
}));

// Import AFTER mocks are in place (module-level Queue creation happens here)
import { closeQueues } from "../../../src/queue/queue.service.js";

describe("queue.service", () => {
  describe("createQueue() — module initialization", () => {
    it("should have created 5 queue instances (mail, pdf, cleanup, reports, audit)", () => {
      expect(MockQueue).toHaveBeenCalledTimes(5);
    });

    it("should create a queue named 'mail-queue'", () => {
      const names = (MockQueue as jest.Mock).mock.calls.map(([name]) => name);
      expect(names).toContain("mail-queue");
    });

    it("should register an error listener on each queue", () => {
      const errorListeners = capturedOnCalls.filter(([event]) => event === "error");
      expect(errorListeners).toHaveLength(5); // one per queue
    });

    it("should log error when the error event fires", () => {
      // Trigger the first registered error handler
      const [, errorHandler] = capturedOnCalls.find(([e]) => e === "error")!;
      errorHandler(new Error("Redis down"));
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe("closeQueues()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call close() on all 5 registered queues", async () => {
      mockQueueClose.mockResolvedValue(undefined);

      await closeQueues();

      // 5 queues were registered during module init
      expect(mockQueueClose).toHaveBeenCalledTimes(5);
    });

    it("should log an info message for each successfully closed queue", async () => {
      mockQueueClose.mockResolvedValue(undefined);

      await closeQueues();

      expect(mockLoggerInfo).toHaveBeenCalledTimes(5);
    });

    it("should log an error and continue when a queue fails to close", async () => {
      // First queue fails, others succeed
      mockQueueClose
        .mockRejectedValueOnce(new Error("Close failed"))
        .mockResolvedValue(undefined);

      await closeQueues();

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      // Remaining queues still attempted
      expect(mockQueueClose).toHaveBeenCalledTimes(5);
    });
  });
});
