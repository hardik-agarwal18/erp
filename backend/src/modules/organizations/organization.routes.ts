import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  requireRole,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
import { organizationController } from "./organization.controller.js";
import { organizationContextMiddleware } from "./organization.middleware.js";
import {
  createOrganizationSchema,
  inviteMemberSchema,
  organizationIdParamSchema,
  organizationMemberParamsSchema,
  transferOwnershipSchema,
  updateMemberSchema,
  updateOrganizationSchema,
} from "./organization.validators.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate(createOrganizationSchema),
  asyncHandler(organizationController.createOrganization),
);
router.get("/", asyncHandler(organizationController.listOrganizations));

router.get(
  "/:id",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  asyncHandler(organizationController.getOrganization),
);
router.patch(
  "/:id",
  validate(updateOrganizationSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  asyncHandler(organizationController.updateOrganization),
);
router.delete(
  "/:id",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requireRole("owner"),
  requirePermission(PERMISSIONS.ORGANIZATION_DELETE),
  asyncHandler(organizationController.deleteOrganization),
);
router.get(
  "/:id/members",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION_MEMBERS),
  asyncHandler(organizationController.listMembers),
);
router.get(
  "/:id/audit-logs",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
  asyncHandler(organizationController.listAuditLogs),
);
router.post(
  "/:id/members/invite",
  validate(inviteMemberSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION_INVITATIONS),
  asyncHandler(organizationController.inviteMember),
);
router.patch(
  "/:id/members/:memberId",
  validate(updateMemberSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION_MEMBERS),
  asyncHandler(organizationController.updateMemberRole),
);
router.delete(
  "/:id/members/:memberId",
  validate(organizationMemberParamsSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.USERS_DELETE),
  asyncHandler(organizationController.removeMember),
);
router.post(
  "/:id/leave",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  asyncHandler(organizationController.leaveOrganization),
);
router.post(
  "/:id/transfer-ownership",
  validate(transferOwnershipSchema),
  organizationContextMiddleware,
  requireRole("owner"),
  requirePermission(PERMISSIONS.ORGANIZATION_TRANSFER_OWNERSHIP),
  asyncHandler(organizationController.transferOwnership),
);

export default router;
