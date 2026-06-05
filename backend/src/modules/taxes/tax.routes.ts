import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
import { taxController } from "./tax.controller.js";
import {
  createTaxSchema,
  listTaxesSchema,
  taxIdParamSchema,
  updateTaxSchema,
} from "./tax.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.TAXES_MANAGE),
  validate(createTaxSchema),
  asyncHandler(taxController.createTax),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.TAXES_MANAGE),
  validate(listTaxesSchema),
  asyncHandler(taxController.listTaxes),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.TAXES_MANAGE),
  validate(updateTaxSchema),
  asyncHandler(taxController.updateTax),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.TAXES_MANAGE),
  validate(taxIdParamSchema),
  asyncHandler(taxController.archiveTax),
);

export default router;
