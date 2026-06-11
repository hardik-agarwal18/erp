// @ts-nocheck
import { Router } from "express";

import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  requireRole,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
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
import { joinRequestController } from "./join-request.controller.js";
import {
  createJoinRequestSchema,
  joinRequestIdParamSchema,
} from "./join-request.validators.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate(createOrganizationSchema),
  asyncHandler(organizationController.createOrganization),
);
router.post(
  "/join",
  validate(createJoinRequestSchema),
  asyncHandler(joinRequestController.createJoinRequest),
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
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  asyncHandler(organizationController.listMembers),
);
router.get(
  "/:id/audit-logs",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.AUDIT_READ),
  asyncHandler(organizationController.listAuditLogs),
);
router.post(
  "/:id/members/invite",
  validate(inviteMemberSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  asyncHandler(organizationController.inviteMember),
);
router.patch(
  "/:id/members/:memberId",
  validate(updateMemberSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.MEMBER_UPDATE),
  asyncHandler(organizationController.updateMemberRole),
);
router.delete(
  "/:id/members/:memberId",
  validate(organizationMemberParamsSchema),
  organizationContextMiddleware,
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
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
  requirePermission(PERMISSIONS.OWNERSHIP_TRANSFER),
  asyncHandler(organizationController.transferOwnership),
);
router.get(
  "/:id/join-requests",
  validate(organizationIdParamSchema),
  organizationContextMiddleware,
  requireRole("owner", "admin"),
  asyncHandler(joinRequestController.listJoinRequests),
);
router.post(
  "/:id/join-requests/:requestId/approve",
  validate(joinRequestIdParamSchema),
  organizationContextMiddleware,
  requireRole("owner", "admin"),
  asyncHandler(joinRequestController.approveJoinRequest),
);
router.post(
  "/:id/join-requests/:requestId/reject",
  validate(joinRequestIdParamSchema),
  organizationContextMiddleware,
  requireRole("owner", "admin"),
  asyncHandler(joinRequestController.rejectJoinRequest),
);

export default router;
