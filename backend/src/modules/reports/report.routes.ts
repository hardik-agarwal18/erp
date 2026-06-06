import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { reportController } from "./report.controller.js";
import { reportRangeSchema } from "./report.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get(
  "/sales",
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validate(reportRangeSchema),
  asyncHandler(reportController.salesReport),
);
router.get(
  "/expenses",
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validate(reportRangeSchema),
  asyncHandler(reportController.expenseReport),
);
router.get(
  "/inventory",
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  asyncHandler(reportController.inventoryReport),
);
router.get(
  "/tax",
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validate(reportRangeSchema),
  asyncHandler(reportController.taxReport),
);
router.get(
  "/dashboard",
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  asyncHandler(reportController.dashboard),
);
router.post(
  "/export",
  requirePermission(PERMISSIONS.REPORTS_EXPORT),
  asyncHandler(reportController.exportReport),
);
router.get(
  "/export/:jobId",
  requirePermission(PERMISSIONS.REPORTS_EXPORT),
  asyncHandler(reportController.getExportStatus),
);

export default router;
