import { PERMISSIONS } from "../../src/shared/constants/rbac.js";

export const permissionFixtures = {
  memberSafe: [PERMISSIONS.ORGANIZATION_VIEW, PERMISSIONS.WORKSPACE_SWITCH],
  management: [
    PERMISSIONS.ORGANIZATION_MEMBERS,
    PERMISSIONS.ORGANIZATION_INVITATIONS,
    PERMISSIONS.ROLES_MANAGE,
  ],
} as const;
