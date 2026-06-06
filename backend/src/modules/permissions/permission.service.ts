import prisma from "../../config/database.js";

export const permissionService = {
  listPermissions: () => {
    return prisma.permission.findMany({
      where: {
        NOT: {
          name: {
            contains: "_legacy",
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },
};
