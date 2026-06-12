
import "dotenv/config";
import { z } from "zod";

const envSchemaBase = z.object({
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
  COOKIE_SECRET: z.string().min(1),
  METRICS_SECRET: z.string().min(1).optional(),

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
  MAIL_ENABLED: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .optional()
    .default(true),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.preprocess(
    (value) => (value ? Number(value) : undefined),
    z.number().int().positive().optional(),
  ),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  MAIL_FROM: z.string().email().optional(),
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

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.preprocess((value) => {
    if (value === "false" || value === false) return false;
    return true;
  }, z.boolean()).optional().default(true),
  RATE_LIMIT_MAX: z.preprocess(
    (value) => (value ? Number(value) : 100),
    z.number().int().positive()
  ).optional().default(100),
  RATE_LIMIT_WINDOW: z.preprocess(
    (value) => (value ? Number(value) : 15),
    z.number().int().positive()
  ).optional().default(15),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const envSchema = envSchemaBase.superRefine((data, ctx) => {
  if (data.STORAGE_PROVIDER === "s3") {
    if (!data.S3_REGION) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["S3_REGION"], message: "S3_REGION is required when STORAGE_PROVIDER is s3" });
    if (!data.S3_ACCESS_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["S3_ACCESS_KEY"], message: "S3_ACCESS_KEY is required when STORAGE_PROVIDER is s3" });
    if (!data.S3_SECRET_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["S3_SECRET_KEY"], message: "S3_SECRET_KEY is required when STORAGE_PROVIDER is s3" });
    if (!data.S3_BUCKET) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["S3_BUCKET"], message: "S3_BUCKET is required when STORAGE_PROVIDER is s3" });
  }

  if (data.MAIL_ENABLED) {
    if (!data.SMTP_HOST) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_HOST"], message: "SMTP_HOST is required when MAIL_ENABLED is true" });
    if (!data.SMTP_PORT) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_PORT"], message: "SMTP_PORT is required when MAIL_ENABLED is true" });
    if (!data.SMTP_USER) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_USER"], message: "SMTP_USER is required when MAIL_ENABLED is true" });
    if (!data.SMTP_PASS) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_PASS"], message: "SMTP_PASS is required when MAIL_ENABLED is true" });
    if (!data.MAIL_FROM) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["MAIL_FROM"], message: "MAIL_FROM is required when MAIL_ENABLED is true" });
  }
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
