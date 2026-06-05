import pino from "pino";

import { env } from "./env.js";

const logger = pino(
  {
    level: env.NODE_ENV === "production" ? "info" : "debug",

    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "token",
        "refreshToken",
        "accessToken",
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
