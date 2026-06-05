import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { permissionController } from "./permission.controller.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  tenantContextMiddleware({ allowRouteParam: false }),
  requirePermission(PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(permissionController.listPermissions),
);

export default router;
