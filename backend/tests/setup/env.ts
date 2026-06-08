import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import path from "path";

const backendRoot = process.cwd();

const envFiles = [
  ".env.test.local",
  ".env.test",
  ".env.local",
  ".env",
].map((file) => path.join(backendRoot, file));

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    loadEnv({ path: envFile, override: false });
  }
}

process.env.NODE_ENV = "test";
process.env.PORT ??= "5001";
process.env.APP_URL ??= "http://localhost:5001";
process.env.CORS_ORIGIN ??= "http://localhost:3000";

process.env.TEST_DATABASE_URL ??=
  "postgresql://postgres:postgres@127.0.0.1:5433/erp_test?schema=public";
process.env.TEST_REDIS_URL ??= "redis://127.0.0.1:6380/15";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.REDIS_URL = process.env.TEST_REDIS_URL;

process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.EMAIL_VERIFY_SECRET ??= "test-email-verify-secret";
process.env.PASSWORD_RESET_SECRET ??= "test-password-reset-secret";
process.env.COOKIE_SECRET ??= "test-cookie-secret";

process.env.MAIL_FROM ??= "test@example.com";

process.env.SMTP_HOST ??= "localhost";
process.env.SMTP_PORT ??= "1025";
process.env.SMTP_USER ??= "test";
process.env.SMTP_PASS ??= "test";
