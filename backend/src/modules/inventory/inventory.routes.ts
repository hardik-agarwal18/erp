import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { inventoryController } from "./inventory.controller.js";
import {
  adjustStockSchema,
  listInventoryItemsSchema,
  listInventoryMovementsSchema,
  transferStockSchema,
} from "./inventory.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get(
  "/items",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listInventoryItemsSchema),
  asyncHandler(inventoryController.listItems),
);
router.get(
  "/items/:productId",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(inventoryController.getItem),
);
router.get(
  "/movements",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listInventoryMovementsSchema),
  asyncHandler(inventoryController.listMovements),
);
router.post(
  "/adjustments",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(adjustStockSchema),
  asyncHandler(inventoryController.adjustStock),
);
router.post(
  "/transfers",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(transferStockSchema),
  asyncHandler(inventoryController.transferStock),
);

export default router;
