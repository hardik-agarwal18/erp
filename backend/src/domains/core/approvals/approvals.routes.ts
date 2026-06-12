// @ts-nocheck
import { Router } from "express";
import { approvalsController } from "./approvals.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { createApprovalTemplateSchema, actionApprovalSchema } from "./approvals.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// Pending approvals for the current user
router.get("/me/pending", approvalsController.getPendingApprovals);

// History for a specific entity
router.get("/:entityType/:entityId/history", approvalsController.getApprovalHistory);

// Templates
router.post(
  "/templates",
  requirePermission("SETTINGS_MANAGE"),
  validate(createApprovalTemplateSchema),
  approvalsController.createTemplate
);

// Actions
router.post(
  "/:id/approve",
  validate(actionApprovalSchema),
  approvalsController.approve
);

router.post(
  "/:id/reject",
  validate(actionApprovalSchema),
  approvalsController.reject
);

router.post(
  "/:id/cancel",
  approvalsController.cancel
);

export default router;
