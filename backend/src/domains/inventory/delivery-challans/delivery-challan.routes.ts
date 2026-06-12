
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { challanController } from "./delivery-challan.controller.js";
import {
  createChallanSchema,
  listChallansSchema,
  dispatchChallanSchema,
} from "./delivery-challan.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createChallanSchema),
  asyncHandler(challanController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listChallansSchema),
  asyncHandler(challanController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(challanController.getById)
);

router.post(
  "/:id/dispatch",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(dispatchChallanSchema),
  asyncHandler(challanController.dispatch)
);

export default router;
