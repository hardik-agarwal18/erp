import { prisma } from "../setup/testDb.js";

export const getRolePermissions = async (
  organizationId: string,
  roleName: string,
) => {
  const role = await prisma.role.findFirstOrThrow({
    where: {
      organizationId,
      name: roleName,
    },
    include: {
      rolePermissions: {
        select: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return role.rolePermissions.map((item) => item.permission.name);
};

export const roleHasPermission = async (
  organizationId: string,
  roleName: string,
  permissionName: string,
) => {
  const permissions = await getRolePermissions(organizationId, roleName);
  return permissions.includes(permissionName);
};
