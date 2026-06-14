import { Router } from "express";
import { claimsController } from "./claims.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { submitClaimSchema, updateClaimStatusSchema } from "./claims.validators.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// Employees submit and view their own claims
router.post(
  "/",
  requirePermission(PERMISSIONS.MEMBER_VIEW), // All employees can submit claims
  validate(submitClaimSchema),
  claimsController.submitClaim
);

router.get(
  "/",
  requirePermission(PERMISSIONS.MEMBER_VIEW), // All employees can view claims
  claimsController.listClaims
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  claimsController.getClaim
);

// Admins / HR / Managers update the status
router.patch(
  "/:id/status",
  requirePermission(PERMISSIONS.MEMBER_UPDATE), // Or a specific FINANCE_MANAGE permission
  validate(updateClaimStatusSchema),
  claimsController.updateStatus
);

export default router;
