import prisma from "../../config/database.js";

export const permissionService = {
  listPermissions: () => {
    return prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  },
};
