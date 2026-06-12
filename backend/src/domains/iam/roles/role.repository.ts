// @ts-nocheck
import prisma from "../../../config/database.js";

export const roleRepository = {
  listRoles: (
    organizationId: string,
    options: { includeArchived?: boolean } = {},
  ) => {
    return prisma.role.findMany({
      where: {
        organizationId,
        ...(options.includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
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
  },
  findRoleById: (organizationId: string, id: string) => {
    return prisma.role.findFirst({
      where: { id, organizationId },
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
  },
};
