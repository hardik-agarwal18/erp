import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@bull-board/api/bullMQAdapter\\.js$": "@bull-board/api/bullMQAdapter",
  },
  setupFiles: ["<rootDir>/tests/setup/env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/types/**/*.d.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  testTimeout: 20000,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
};

export default config;
