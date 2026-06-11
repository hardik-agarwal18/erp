// @ts-nocheck
import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";

import { env } from "./env.js";

export const loggerContext = new AsyncLocalStorage<Map<string, string>>();

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
  env.NODE_ENV === "production"
    ? undefined
    : pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      }),
);

export default logger;
