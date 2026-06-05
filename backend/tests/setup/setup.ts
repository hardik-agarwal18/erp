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
      })),
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
