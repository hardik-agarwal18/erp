
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { stockGroupController } from "./stock-group.controller.js";
import {
  createStockGroupSchema,
  listStockGroupsSchema,
  updateStockGroupSchema,
} from "./stock-group.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createStockGroupSchema),
  asyncHandler(stockGroupController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listStockGroupsSchema),
  asyncHandler(stockGroupController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(stockGroupController.getById)
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(updateStockGroupSchema),
  asyncHandler(stockGroupController.update)
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_DELETE),
  asyncHandler(stockGroupController.delete)
);

export default router;
