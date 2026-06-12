
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { verificationController } from "./stock-verification.controller.js";
import {
  createVerificationSchema,
  completeVerificationSchema,
  listVerificationsSchema,
} from "./stock-verification.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createVerificationSchema),
  asyncHandler(verificationController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listVerificationsSchema),
  asyncHandler(verificationController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(verificationController.getById)
);

router.post(
  "/:id/complete",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(completeVerificationSchema),
  asyncHandler(verificationController.complete)
);

export default router;
