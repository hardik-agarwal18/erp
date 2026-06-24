import prisma from "../../../config/database.js";

export const customerQueryService = {
  findById: async (organizationId: string, customerId: string) => {
    return prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
  },

  findManyByIds: async (organizationId: string, customerIds: string[]) => {
    return prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: null,
        id: { in: customerIds },
      },
    });
  },
};
