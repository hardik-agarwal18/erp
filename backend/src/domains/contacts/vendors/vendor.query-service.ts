import prisma from "../../../config/database.js";

export const vendorQueryService = {
  findById: async (organizationId: string, vendorId: string) => {
    return prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });
  },
};
