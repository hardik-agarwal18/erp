import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";
import fs from "node:fs";
import path from "node:path";

import { env } from "./env.js";

export const loggerContext = new AsyncLocalStorage<Map<string, string>>();

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const targets = [
  {
    target: "pino/file",
    options: { destination: path.join(logDir, "app.log") },
    level: env.NODE_ENV === "production" ? "info" : env.NODE_ENV === "test" ? "error" : "debug",
  },
  env.NODE_ENV === "production"
    ? {
        target: "pino/file",
        options: { destination: 1 }, // stdout
        level: "info",
      }
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
        level: env.NODE_ENV === "test" ? "error" : "debug",
      },
];

const transport = pino.transport({
  targets: targets as any,
});

const logger = pino(
  {
    level: env.NODE_ENV === "production" ? "info" : env.NODE_ENV === "test" ? "error" : "debug",
    mixin() {
      const store = loggerContext.getStore();
      if (!store) return {};
      const mixinData: Record<string, string> = {};
      if (store.has("reqId")) mixinData.reqId = store.get("reqId")!;
      if (store.has("userId")) mixinData.userId = store.get("userId")!;
      if (store.has("workspaceId")) mixinData.workspaceId = store.get("workspaceId")!;
      return mixinData;
    },

    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'res.headers["set-cookie"]',
        "password",
        "*.password",
        "token",
        "*.token",
        "refreshToken",
        "*.refreshToken",
        "accessToken",
        "*.accessToken",
        "csrfToken",
        "*.csrfToken",
        "smtpPass",
      ],
      remove: true,
    },

    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

export default logger;
