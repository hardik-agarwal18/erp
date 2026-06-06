import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { vendorController } from "./vendor.controller.js";
import {
  createVendorSchema,
  listVendorsSchema,
  updateVendorSchema,
  vendorIdParamSchema,
} from "./vendor.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.VENDORS_CREATE),
  validate(createVendorSchema),
  asyncHandler(vendorController.createVendor),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.VENDORS_VIEW),
  validate(listVendorsSchema),
  asyncHandler(vendorController.listVendors),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.VENDORS_UPDATE),
  validate(updateVendorSchema),
  asyncHandler(vendorController.updateVendor),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.VENDORS_UPDATE),
  validate(vendorIdParamSchema),
  asyncHandler(vendorController.archiveVendor),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.VENDORS_VIEW),
  validate(vendorIdParamSchema),
  asyncHandler(vendorController.getVendor),
);
router.get(
  "/:id/ledger",
  requirePermission(PERMISSIONS.VENDORS_VIEW),
  validate(vendorIdParamSchema),
  asyncHandler(vendorController.getLedger),
);

export default router;
