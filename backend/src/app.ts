import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import logger from "./config/logger.js";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { sanitizeMiddleware } from "./middleware/sanitize.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import roleRoutes from "./modules/roles/role.routes.js";
import permissionRoutes from "./modules/permissions/permission.routes.js";
import invitationRoutes from "./modules/invitations/invitation.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import vendorRoutes from "./modules/vendors/vendor.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import taxRoutes from "./modules/taxes/tax.routes.js";
import transactionRoutes from "./modules/transactions/transaction.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : env.APP_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeMiddleware);
app.use("/api", apiRateLimiter);

import { bullBoardRouter, bullBoardAuth } from "./queue/board.js";
app.use("/api/v1/admin/queues", bullBoardAuth, bullBoardRouter);

import queueObservabilityRoutes from "./queue/observability.js";
app.use("/api/v1/queues", queueObservabilityRoutes);

import healthRoutes from "./modules/health/health.routes.js";
import { registry } from "./monitoring/registry.js";

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/taxes", taxRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use(errorMiddleware);

export default app;
