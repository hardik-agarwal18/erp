import prisma from "../../config/database.js";

export const roleRepository = {
  listRoles: (organizationId: string) => {
    return prisma.role.findMany({
      where: { organizationId },
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
      },
    });
  },
};
