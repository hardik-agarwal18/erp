import prisma from "../../../config/database.js";

export const productQueryService = {
  findManyByIdsWithTax: async (organizationId: string, productIds: string[]) => {
    return prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId,
        deletedAt: null,
      },
      include: { tax: true },
    });
  },
};
