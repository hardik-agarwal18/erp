// @ts-nocheck
import { Router } from "express";

import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { roleController } from "./role.controller.js";
import { createRoleSchema, updateRoleSchema, roleIdParamSchema } from "./role.validators.js";

const router = Router();

router.use(authMiddleware, tenantContextMiddleware({ allowRouteParam: false }));

router.post(
  "/",
  validate(createRoleSchema),
  requirePermission(PERMISSIONS.ROLES_CREATE),
  asyncHandler(roleController.createRole),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.ROLES_VIEW),
  asyncHandler(roleController.listRoles),
);
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.ROLES_VIEW),
  asyncHandler(roleController.listPermissions),
);
router.get(
  "/:id",
  validate(roleIdParamSchema),
  requirePermission(PERMISSIONS.ROLES_VIEW),
  asyncHandler(roleController.getRole),
);
router.patch(
  "/:id",
  validate(updateRoleSchema),
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  asyncHandler(roleController.updateRole),
);
router.post(
  "/:id/archive",
  validate(roleIdParamSchema),
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  asyncHandler(roleController.archiveRole),
);
router.post(
  "/:id/restore",
  validate(roleIdParamSchema),
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  asyncHandler(roleController.restoreRole),
);
router.delete(
  "/:id",
  validate(roleIdParamSchema),
  requirePermission(PERMISSIONS.ROLES_DELETE),
  asyncHandler(roleController.deleteRole),
);

export default router;
