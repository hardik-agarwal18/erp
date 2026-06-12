
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { godownController } from "./godown.controller.js";
import {
  createGodownSchema,
  listGodownsSchema,
  updateGodownSchema,
} from "./godown.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createGodownSchema),
  asyncHandler(godownController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listGodownsSchema),
  asyncHandler(godownController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(godownController.getById)
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(updateGodownSchema),
  asyncHandler(godownController.update)
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_DELETE),
  asyncHandler(godownController.delete)
);

export default router;
