import prisma from "../../config/database.js";
import { DEFAULT_PERMISSIONS } from "../../shared/constants/rbac.js";
import { clearMembersPermissionCache } from "../../shared/utils/permissions.js";
import { slugify } from "../../shared/utils/slug.js";
import ApiError from "../../utils/ApiError.js";

import { roleRepository } from "./role.repository.js";

const getPermissionIds = async (permissionNames: string[]) => {
  const permissions = await prisma.permission.findMany({
    where: { name: { in: permissionNames } },
  });

  if (permissions.length !== permissionNames.length) {
    throw new ApiError(400, "One or more permissions are invalid");
  }

  return permissions.map((permission) => permission.id);
};

const serializeRole = (
  role: Awaited<ReturnType<typeof roleRepository.listRoles>>[number],
) => {
  if (!role.rolePermissions) {
    console.error("ROLE HAS NO ROLEPERMISSIONS:", role);
  }
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: (role.rolePermissions || []).map((item) => item.permission),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

export const roleService = {
  listRoles: async (organizationId: string) => {
    const roles = await roleRepository.listRoles(organizationId);
    return roles.map(serializeRole);
  },

  createRole: async (
    organizationId: string,
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

    if (["owner", "admin", "manager", "member"].includes(normalizedName)) {
      throw new ApiError(400, "System roles cannot be recreated");
    }

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
      },
    });

    return serializeRole(role);
  },

  updateRole: async (
    organizationId: string,
    roleId: string,
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

    const permissionIds = payload.permissionNames
      ? await getPermissionIds(payload.permissionNames)
      : null;

    const updatedRole = await prisma.$transaction(async (tx) => {
      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        });
      }

      return tx.role.update({
        where: { id: roleId },
        data: {
          name: payload.name ? slugify(payload.name).replace(/-/g, "_") : undefined,
          description: payload.description,
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
        },
      });
    });

    const affectedMembers = await prisma.organizationMember.findMany({
      where: { roleId },
      select: { id: true },
    });
    await clearMembersPermissionCache(affectedMembers.map((member) => member.id));

    return serializeRole(updatedRole);
  },

  deleteRole: async (organizationId: string, roleId: string) => {
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
      throw new ApiError(400, "Cannot delete a role assigned to members");
    }

    await prisma.role.delete({ where: { id: roleId } });
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
