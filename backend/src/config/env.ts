import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.preprocess(
    (value) => (value ? Number(value) : 5000),
    z.number().int().positive(),
  ),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  TEST_REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Storage settings
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("./uploads"),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  EMAIL_VERIFY_SECRET: z.string().min(1),
  PASSWORD_RESET_SECRET: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.preprocess(
    (value) => Number(value),
    z.number().int().positive(),
  ),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().email(),
  SMTP_SECURE: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .optional()
    .default(false),
  APP_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  QUEUE_ENABLED: z
    .preprocess((value) => {
      if (value === "false" || value === false) return false;
      return true;
    }, z.boolean())
    .optional()
    .default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = Object.freeze({
  ...parsed.data,
  APP_URL: parsed.data.APP_URL ?? `http://localhost:${parsed.data.PORT}`,
});
