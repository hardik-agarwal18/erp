// @ts-nocheck
import prisma from "../../../config/database.js";
import {
  DEFAULT_PERMISSIONS,
  MAX_CUSTOM_ROLES_PER_ORGANIZATION,
  PROTECTED_PERMISSIONS,
} from "../../shared/constants/rbac.js";
import { clearMembersPermissionCache } from "../../../shared/utils/permissions.js";
import { slugify } from "../../../shared/utils/slug.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../services/audit/index.js";

import { roleRepository } from "./role.repository.js";

const SYSTEM_ROLE_BLOCKLIST = ["owner", "admin", "manager", "member", "super_admin"];

const getPermissionIds = async (permissionNames: string[]) => {
  const permissions = await prisma.permission.findMany({
    where: { name: { in: permissionNames } },
  });

  if (permissions.length !== permissionNames.length) {
    throw new ApiError(400, "One or more permissions are invalid");
  }

  return permissions.map((permission) => permission.id);
};

const validateProtectedPermissions = (permissionNames: string[]) => {
  const violations = permissionNames.filter((name) =>
    (PROTECTED_PERMISSIONS as readonly string[]).includes(name),
  );

  if (violations.length > 0) {
    throw new ApiError(
      400,
      `Cannot assign protected permissions to custom roles: ${violations.join(", ")}`,
    );
  }
};

const serializeRole = (
  role: Awaited<ReturnType<typeof roleRepository.listRoles>>[number],
) => {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    archivedAt: role.archivedAt,
    memberCount: (role as any)._count?.members ?? 0,
    permissions: (role.rolePermissions || []).map((item) => item.permission),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

export const roleService = {
  listRoles: async (
    organizationId: string,
    options: { includeArchived?: boolean } = {},
  ) => {
    const roles = await roleRepository.listRoles(organizationId, {
      includeArchived: options.includeArchived ?? false,
    });
    return roles.map(serializeRole);
  },

  createRole: async (
    organizationId: string,
    actorUserId: string,
    payload: {
      name: string;
      description?: string;
      permissionNames: string[];
    },
  ) => {
    const normalizedName = slugify(payload.name).replace(/-/g, "_");
    if (!normalizedName) {
      throw new ApiError(400, "Role name is invalid");
    }

    if (SYSTEM_ROLE_BLOCKLIST.includes(normalizedName)) {
      throw new ApiError(400, "System roles cannot be recreated");
    }

    // Enforce custom role limit
    const customRoleCount = await prisma.role.count({
      where: { organizationId, isSystem: false },
    });

    if (customRoleCount >= MAX_CUSTOM_ROLES_PER_ORGANIZATION) {
      throw new ApiError(
        400,
        `Maximum custom role limit (${MAX_CUSTOM_ROLES_PER_ORGANIZATION}) reached for this organization`,
      );
    }

    // Reject protected permissions
    validateProtectedPermissions(payload.permissionNames);

    const permissionIds = await getPermissionIds(payload.permissionNames);

    const role = await prisma.role.create({
      data: {
        organizationId,
        name: normalizedName,
        description: payload.description,
        isSystem: false,
        rolePermissions: {
          createMany: {
            data: permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      },
      include: {
        rolePermissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROLE_CREATED,
      entityType: AUDIT_ENTITY_TYPES.ROLE,
      entityId: role.id,
      metadata: {
        roleName: role.name,
        permissionCount: payload.permissionNames.length,
      },
    });

    return serializeRole(role);
  },

  updateRole: async (
    organizationId: string,
    roleId: string,
    actorUserId: string,
    payload: {
      name?: string;
      description?: string;
      permissionNames?: string[];
    },
  ) => {
    const role = await roleRepository.findRoleById(organizationId, roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.isSystem) {
      throw new ApiError(400, "System roles cannot be modified");
    }

    if (role.archivedAt) {
      throw new ApiError(400, "Archived roles cannot be modified. Restore the role first.");
    }

    // Validate protected permissions if permissions are being updated
    if (payload.permissionNames) {
      validateProtectedPermissions(payload.permissionNames);
    }

    const permissionIds = payload.permissionNames
      ? await getPermissionIds(payload.permissionNames)
      : null;

    const permissionsChanged = permissionIds !== null;

    await prisma.$transaction(async (tx) => {
      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        });
      }

      const normalizedName = payload.name
        ? slugify(payload.name).replace(/-/g, "_")
        : undefined;

      if (normalizedName && SYSTEM_ROLE_BLOCKLIST.includes(normalizedName)) {
        throw new ApiError(400, "Cannot rename a role to a system role name");
      }

      await tx.role.update({
        where: { id: roleId },
        data: {
          name: normalizedName,
          description: payload.description,
        },
      });
    });

    // Invalidate permission caches for all affected members
    const affectedMembers = await prisma.organizationMember.findMany({
      where: { roleId },
      select: { id: true },
    });
    await clearMembersPermissionCache(affectedMembers.map((member) => member.id));

    // Audit
    const auditAction = permissionsChanged
      ? AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED
      : AUDIT_ACTIONS.ROLE_UPDATED;

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: auditAction,
      entityType: AUDIT_ENTITY_TYPES.ROLE,
      entityId: roleId,
      metadata: {
        roleName: role.name,
        permissionsChanged,
        affectedMembers: affectedMembers.length,
      },
    });

    const finalRole = await roleRepository.findRoleById(organizationId, roleId);
    return serializeRole(finalRole as any);
  },

  archiveRole: async (
    organizationId: string,
    roleId: string,
    actorUserId: string,
  ) => {
    const role = await roleRepository.findRoleById(organizationId, roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.isSystem) {
      throw new ApiError(400, "System roles cannot be archived");
    }

    if (role.archivedAt) {
      throw new ApiError(400, "Role is already archived");
    }

    await prisma.role.update({
      where: { id: roleId },
      data: { archivedAt: new Date() },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROLE_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.ROLE,
      entityId: roleId,
      metadata: {
        roleName: role.name,
      },
    });

    const updatedRole = await roleRepository.findRoleById(organizationId, roleId);
    return serializeRole(updatedRole as any);
  },

  restoreRole: async (
    organizationId: string,
    roleId: string,
    actorUserId: string,
  ) => {
    const role = await roleRepository.findRoleById(organizationId, roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (!role.archivedAt) {
      throw new ApiError(400, "Role is not archived");
    }

    // Enforce custom role limit (restoring should count against it)
    const activeCustomRoleCount = await prisma.role.count({
      where: { organizationId, isSystem: false, archivedAt: null },
    });

    if (activeCustomRoleCount >= MAX_CUSTOM_ROLES_PER_ORGANIZATION) {
      throw new ApiError(
        400,
        `Cannot restore: maximum custom role limit (${MAX_CUSTOM_ROLES_PER_ORGANIZATION}) reached`,
      );
    }

    await prisma.role.update({
      where: { id: roleId },
      data: { archivedAt: null },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROLE_RESTORED,
      entityType: AUDIT_ENTITY_TYPES.ROLE,
      entityId: roleId,
      metadata: {
        roleName: role.name,
      },
    });

    const updatedRole = await roleRepository.findRoleById(organizationId, roleId);
    return serializeRole(updatedRole as any);
  },

  deleteRole: async (
    organizationId: string,
    roleId: string,
    actorUserId: string,
  ) => {
    const role = await roleRepository.findRoleById(organizationId, roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.isSystem) {
      throw new ApiError(400, "System roles cannot be deleted");
    }

    const memberCount = await prisma.organizationMember.count({
      where: { roleId, organizationId },
    });
    if (memberCount > 0) {
      throw new ApiError(400, "Cannot delete a role assigned to members. Reassign members first.");
    }

    await prisma.role.delete({ where: { id: roleId } });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROLE_DELETED,
      entityType: AUDIT_ENTITY_TYPES.ROLE,
      entityId: roleId,
      metadata: {
        roleName: role.name,
      },
    });
  },

  listAvailablePermissions: () => {
    return DEFAULT_PERMISSIONS;
  },

  getRole: async (organizationId: string, roleId: string) => {
    const role = await roleRepository.findRoleById(organizationId, roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }
    return serializeRole(role);
  },
};
