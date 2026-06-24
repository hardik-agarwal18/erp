import prisma from "../../../config/database.js";

export const invoiceQueryService = {
  getOpenAmountDueForCustomer: async (organizationId: string, customerId: string) => {
    const openInvoices = await prisma.invoice.aggregate({
      where: { 
        organizationId, 
        customerId, 
        status: { notIn: ["VOID" as any, "WRITTEN_OFF" as any] } 
      } as any,
      _sum: { amountDue: true } as any
    });
    return Number((openInvoices as any)._sum?.amountDue ?? 0);
  },

  getLedgerForCustomer: async (organizationId: string, customerId: string) => {
    const [invoices, payments, invoiceTotals, paymentTotals] = await prisma.$transaction([
      prisma.invoice.findMany({
        where: { organizationId, customerId, deletedAt: null },
        orderBy: { issueDate: "desc" },
      }),
      prisma.payment.findMany({
        where: { organizationId, invoice: { customerId }, deletedAt: null },
        orderBy: { paymentDate: "desc" },
        include: { invoice: true },
      }),
      prisma.invoice.aggregate({
        where: { organizationId, customerId, deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { organizationId, invoice: { customerId }, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);
    
    const totalInvoiced = Number(invoiceTotals._sum.totalAmount ?? 0);
    const totalPaid = Number(paymentTotals._sum.amount ?? 0);

    return {
      invoices,
      payments,
      totalInvoiced,
      totalPaid
    };
  },

  getOpenInvoicesForAging: async (organizationId: string) => {
    return prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ["POSTED", "OVERDUE", "PARTIALLY_PAID"] } as any,
        amountDue: { gt: 0 },
        deletedAt: null,
      } as any,
      include: { customer: true },
    });
  },

  listForRange: async (organizationId: string, start?: Date, end?: Date) => {
    return prisma.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] } as any,
        ...(start || end ? { issueDate: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      },
      include: { customer: true },
    });
  },

  groupBySalesCustomer: async (organizationId: string, start?: Date, end?: Date) => {
    return prisma.invoice.groupBy({
      by: ["customerId"],
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] } as any,
        ...(start || end ? { issueDate: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
  },

  aggregateSales: async (organizationId: string, start?: Date, end?: Date) => {
    return prisma.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] } as any,
        ...(start || end ? { issueDate: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
  },

  aggregateTaxAmount: async (organizationId: string, start?: Date, end?: Date) => {
    return prisma.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] } as any,
        ...(start || end ? { issueDate: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      },
      _sum: { taxAmount: true },
    });
  },

  countUnpaid: async (organizationId: string) => {
    return prisma.invoice.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } as any,
      },
    });
  },

  listDatesAndAmounts: async (organizationId: string, start?: Date, end?: Date) => {
    return prisma.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"] } as any,
        ...(start || end ? { issueDate: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      },
      select: { totalAmount: true, issueDate: true },
    });
  }
};
