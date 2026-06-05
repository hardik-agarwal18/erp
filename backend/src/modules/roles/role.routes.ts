import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { roleController } from "./role.controller.js";
import { createRoleSchema, updateRoleSchema } from "./role.validators.js";

const router = Router();

router.use(authMiddleware, tenantContextMiddleware({ allowRouteParam: false }));

router.post(
  "/",
  validate(createRoleSchema),
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(roleController.createRole),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(roleController.listRoles),
);
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(roleController.listPermissions),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(roleController.getRole),
);
router.patch(
  "/:id",
  validate(updateRoleSchema),
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(roleController.updateRole),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(roleController.deleteRole),
);

export default router;
