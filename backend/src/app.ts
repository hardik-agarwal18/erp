
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
import { idempotencyMiddleware } from "./middleware/idempotency.middleware.js";
import authRoutes from "./domains/iam/auth/auth.routes.js";
import organizationRoutes from "./domains/iam/organizations/organization.routes.js";
import roleRoutes from "./domains/iam/roles/role.routes.js";
import permissionRoutes from "./domains/iam/permissions/permission.routes.js";
// import invitationRoutes from "./domains/iam/invitations/invitation.routes.js";
import customerRoutes from "./domains/contacts/customers/customer.routes.js";
import vendorRoutes from "./domains/contacts/vendors/vendor.routes.js";
import productRoutes from "./domains/inventory/products/product.routes.js";
import inventoryRoutes from "./domains/inventory/inventory/inventory.routes.js";
import invoiceRoutes from "./domains/financials/invoices/invoice.routes.js";
import paymentRoutes from "./domains/financials/payments/payment.routes.js";
import expenseRoutes from "./domains/financials/expenses/expense.routes.js";
import taxRoutes from "./domains/financials/taxes/tax.routes.js";
import transactionRoutes from "./domains/financials/transactions/transaction.routes.js";
import reportRoutes from "./domains/core/reports/report.routes.js";
import accountingRoutes from "./domains/financials/accounting/accounting.routes.js";
import demoRoutes from "./domains/core/demo/demo.routes.js";
import godownRoutes from "./domains/inventory/godowns/godown.routes.js";
import stockGroupRoutes from "./domains/inventory/stock-groups/stock-group.routes.js";
import grnRoutes from "./domains/inventory/grn/grn.routes.js";
import challanRoutes from "./domains/inventory/delivery-challans/delivery-challan.routes.js";
import journalRoutes from "./domains/inventory/stock-journals/stock-journal.routes.js";
import verificationRoutes from "./domains/inventory/stock-verifications/stock-verification.routes.js";
import batchRoutes from "./domains/inventory/batches/batch.routes.js";
import serialRoutes from "./domains/inventory/serial-numbers/serial-number.routes.js";
import employeeRoutes from "./domains/hrms/employees/employee.routes.js";
import departmentRoutes from "./domains/hrms/employees/department.routes.js";
import designationRoutes from "./domains/hrms/employees/designation.routes.js";
import shiftRoutes from "./domains/hrms/shifts/shift.routes.js";

const app = express();

app.set("trust proxy", 1);
import { loggerContext } from "./config/logger.js";
import crypto from "crypto";

app.use((req, _res, next) => {
  const store = new Map<string, string>();
  const reqId = crypto.randomUUID();
  store.set("reqId", reqId);
  req.id = reqId;
  loggerContext.run(store, next);
});

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        host: req.headers.host,
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
}));
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

import healthRoutes from "./domains/core/health/health.routes.js";
import { registry } from "./monitoring/registry.js";
import { metricsAuth } from "./middleware/metrics.middleware.js";

app.get("/metrics", metricsAuth, async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/demo", demoRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/permissions", permissionRoutes);
// app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", idempotencyMiddleware, inventoryRoutes);
app.use("/api/v1/invoices", idempotencyMiddleware, invoiceRoutes);
app.use("/api/v1/payments", idempotencyMiddleware, paymentRoutes);
app.use("/api/v1/expenses", idempotencyMiddleware, expenseRoutes);
app.use("/api/v1/taxes", taxRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/approvals", approvalRoutes);
app.use("/api/v1/accounting", accountingRoutes);
app.use("/api/v1/purchase-orders", purchaseOrderRoutes);
app.use("/api/v1/vendor-invoices", vendorInvoiceRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaves", leaveRoutes);
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/godowns", godownRoutes);
app.use("/api/v1/stock-groups", stockGroupRoutes);
app.use("/api/v1/grns", grnRoutes);
app.use("/api/v1/delivery-challans", challanRoutes);
app.use("/api/v1/stock-journals", journalRoutes);
app.use("/api/v1/stock-verifications", verificationRoutes);
app.use("/api/v1/batches", batchRoutes);
app.use("/api/v1/serial-numbers", serialRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/designations", designationRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/holidays", holidayRoutes);

import path from "path";
app.use("/api/v1/storage", express.static(path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH || "./uploads")));

app.use(errorMiddleware);

export default app;
