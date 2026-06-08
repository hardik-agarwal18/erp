import prisma from "../../config/database.js";

const resolveDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;
  return { start, end };
};

export const reportRepository = {
  listInvoicesForRange: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] },
        ...(start || end
          ? {
              issueDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      include: { customer: true },
    });
  },
  listExpensesForRange: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(start || end
          ? {
              expenseDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
    });
  },
  groupInvoiceSalesByCustomer: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.invoice.groupBy({
      by: ["customerId"],
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] },
        ...(start || end
          ? {
              issueDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
  },
  findCustomersByIds: (organizationId: string, customerIds: string[]) => {
    return prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: null,
        id: { in: customerIds },
      },
    });
  },
  groupExpensesByCategory: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.expense.groupBy({
      by: ["category"],
      where: {
        organizationId,
        deletedAt: null,
        ...(start || end
          ? {
              expenseDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
  },
  listInventoryItems: (organizationId: string) => {
    return prisma.inventoryItem.findMany({
      where: { organizationId, deletedAt: null },
      include: { product: true },
    });
  },
  listLowStockCandidates: (organizationId: string) => {
    return prisma.inventoryItem.findMany({
      where: {
        organizationId,
        deletedAt: null,
        reorderLevel: { not: null },
      },
      include: { product: true },
    });
  },
  listRecentInventoryMovements: (organizationId: string, take = 25) => {
    return prisma.inventoryMovement.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
      include: { product: true },
    });
  },
  aggregateInvoiceTaxAmount: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] },
        ...(start || end
          ? {
              issueDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      _sum: { taxAmount: true },
    });
  },
  countUnpaidInvoices: (organizationId: string) => {
    return prisma.invoice.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
    });
  },
  aggregateInvoiceSales: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] },
        ...(start || end
          ? {
              issueDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
  },
  aggregateExpenses: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.expense.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        ...(start || end
          ? {
              expenseDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
  },
  listExpenseDatesAndAmounts: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(start || end
          ? {
              expenseDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      select: { amount: true, expenseDate: true },
    });
  },
  listInvoiceDatesAndAmounts: (
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const { start, end } = resolveDateRange(startDate, endDate);
    return prisma.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] },
        ...(start || end
          ? {
              issueDate: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
      select: { totalAmount: true, issueDate: true },
    });
  },
  calculateStockValue: async (organizationId: string) => {
    // Prisma aggregate does not support multiplication across relations
    // We use raw SQL for performance instead of mapping over all items in memory
    const result = await prisma.$queryRaw<{ stockValue: number }[]>`
      SELECT SUM(i.quantity * p."sellingPrice") as "stockValue"
      FROM "InventoryItem" i
      JOIN "Product" p ON i."productId" = p.id
      WHERE i."organizationId" = ${organizationId}
        AND i."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
    `;
    return result[0]?.stockValue ?? 0;
  },
};
