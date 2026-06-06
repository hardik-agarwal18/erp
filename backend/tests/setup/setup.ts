import { afterAll, beforeAll, beforeEach, jest } from "@jest/globals";

import {
  connectTestInfrastructure,
  disconnectTestInfrastructure,
  resetTestState,
} from "./testDb.js";

jest.setTimeout(60000);

const isIntegrationTestFile = () => {
  const testPath = expect.getState().testPath ?? "";
  return /[\\/]tests[\\/](integration|helpers|setup)[\\/]/.test(testPath);
};

// Globally mock ioredis for unit tests to prevent actual TCP connections
if (!isIntegrationTestFile()) {
  jest.mock("ioredis", () => {
    return {
      Redis: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue("OK"),
        ping: jest.fn().mockResolvedValue("PONG"),
        duplicate: jest.fn().mockReturnThis(),
        bgsave: jest.fn(),
        disconnect: jest.fn(),
        status: "ready",
      })),
    };
  });

  jest.mock("bullmq", () => {
    return {
      Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      })),
      Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      })),
      QueueScheduler: jest.fn(),
    };
  });
}

beforeAll(async () => {
  if (isIntegrationTestFile()) {
    await connectTestInfrastructure();
    await resetTestState();
  }
});

beforeEach(async () => {
  if (isIntegrationTestFile()) {
    await resetTestState();
  }
});

afterAll(async () => {
  if (isIntegrationTestFile()) {
    await disconnectTestInfrastructure();
  }
});
