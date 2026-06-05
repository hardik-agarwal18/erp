import nodemailer, { type Transporter } from "nodemailer";

import { env } from "./env.js";
import logger from "./logger.js";

export const mailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,

  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },

  pool: true,
  maxConnections: 5,
  maxMessages: 100,

  tls: {
    rejectUnauthorized: env.NODE_ENV === "production",
  },
} as const;

export const mailFrom = env.MAIL_FROM;

export const transporter: Transporter = nodemailer.createTransport(mailConfig);

/**
 * Verify SMTP Connection
 */
export const verifyMailConnection = async (): Promise<boolean> => {
  if (env.NODE_ENV === "test") {
    return true;
  }

  try {
    await transporter.verify();

    logger.info("SMTP connection verified");

    return true;
  } catch (error) {
    logger.error(
      {
        error,
      },
      "SMTP connection verification failed",
    );

    return false;
  }
};

/**
 * Graceful Shutdown
 */
export const closeMailTransport = async (): Promise<void> => {
  transporter.close();

  logger.info("SMTP transporter closed");
};

export default transporter;
