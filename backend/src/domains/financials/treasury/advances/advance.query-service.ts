import prisma from "../../../../config/database.js";

export const advanceQueryService = {
  getUnappliedAdvancesForCustomer: async (organizationId: string, customerId: string) => {
    const advances = await prisma.advance.aggregate({
      where: { organizationId, customerId, status: "ISSUED" } as any,
      _sum: { outstandingAmount: true } as any
    });
    return Number((advances as any)._sum?.outstandingAmount ?? 0);
  },
};
