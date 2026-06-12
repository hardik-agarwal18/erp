// @ts-nocheck
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { grnController } from "./grn.controller.js";
import {
  createGRNSchema,
  listGRNSchema,
  receiveGRNSchema,
} from "./grn.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createGRNSchema),
  asyncHandler(grnController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listGRNSchema),
  asyncHandler(grnController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(grnController.getById)
);

router.post(
  "/:id/receive",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(receiveGRNSchema),
  asyncHandler(grnController.receive)
);

export default router;
