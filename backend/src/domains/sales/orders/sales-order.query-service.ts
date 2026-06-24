import prisma from "../../../config/database.js";

export const salesOrderQueryService = {
  getOpenOrdersTotalForCustomer: async (organizationId: string, customerId: string) => {
    const openOrders = await prisma.salesOrder.aggregate({
      where: { 
        organizationId, 
        customerId, 
        status: { in: ["CONFIRMED", "PARTIALLY_FULFILLED"] } 
      },
      _sum: { total: true }
    });
    return Number(openOrders._sum.total ?? 0);
  },
};
