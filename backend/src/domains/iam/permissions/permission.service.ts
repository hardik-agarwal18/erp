// @ts-nocheck
import prisma from "../../../config/database.js";
import { PROTECTED_PERMISSIONS } from "../../../shared/constants/rbac.js";

export const permissionService = {
  listPermissions: (options?: { assignable?: boolean }) => {
    return prisma.permission.findMany({
      where: {
        NOT: {
          name: {
            contains: "_legacy",
          },
        },
        ...(options?.assignable
          ? {
              name: {
                notIn: [...PROTECTED_PERMISSIONS],
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
  },
};
