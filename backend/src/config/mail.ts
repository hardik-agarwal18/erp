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

export const checkMailHealth = async (): Promise<boolean> => {
  if (env.NODE_ENV === "test" || !env.MAIL_ENABLED) {
    return true;
  }

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Verify SMTP Connection
 */
export const verifyMailConnection = async (): Promise<boolean> => {
  const isHealthy = await checkMailHealth();
  
  if (isHealthy && env.MAIL_ENABLED && env.NODE_ENV !== "test") {
    logger.info("SMTP connection verified");
  } else if (!isHealthy) {
    logger.error("SMTP connection verification failed");
  }

  return isHealthy;
};

/**
 * Graceful Shutdown
 */
export const closeMailTransport = async (): Promise<void> => {
  transporter.close();

  logger.info("SMTP transporter closed");
};

export default transporter;
