// @ts-nocheck
import { Router } from "express";
import { getQueueMetrics } from "./metrics.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantContextMiddleware, requireRole } from "../middleware/tenant.middleware.js";

const router = Router();

// Protected by Authentication + RBAC (Admin+ required)
router.get(
  "/metrics",
  authMiddleware,
  tenantContextMiddleware({ enforceTokenOrganization: false }),
  requireRole("admin", "owner"),
  getQueueMetrics
);

export default router;
