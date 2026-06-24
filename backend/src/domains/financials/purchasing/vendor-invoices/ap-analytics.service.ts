import prisma from "../../../../config/database.js";
import { VendorInvoiceStatus } from "@prisma/client";

export const apAnalyticsService = {
  getApAging: async (organizationId: string) => {
    // Fetch all posted/partially paid invoices
    const invoices = await prisma.vendorInvoice.findMany({
      where: {
        organizationId,
        status: { in: [VendorInvoiceStatus.POSTED, VendorInvoiceStatus.PARTIALLY_PAID] as any[] }
      },
      include: {
        allocations: true,
        vendor: true
      }
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
      total: 0
    };

    const now = new Date();

    for (const invoice of invoices) {
      const allocatedAmount = invoice.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      const remainingBalance = Number(invoice.totalAmount) - allocatedAmount;
      if (remainingBalance <= 0) continue;

      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.invoiceDate);
      const diffTime = Math.max(0, now.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        aging.current += remainingBalance;
      } else if (diffDays <= 30) {
        aging.days30 += remainingBalance;
      } else if (diffDays <= 60) {
        aging.days60 += remainingBalance;
      } else if (diffDays <= 90) {
        aging.days90 += remainingBalance;
      } else {
        aging.days90Plus += remainingBalance;
      }

      aging.total += remainingBalance;
    }

    return aging;
  },

  getVendorStatement: async (organizationId: string, vendorId: string) => {
    // Simplified statement generation
    const invoices = await prisma.vendorInvoice.findMany({
       where: { organizationId, vendorId, status: { notIn: [VendorInvoiceStatus.DRAFT, VendorInvoiceStatus.VOID] } },
       orderBy: { invoiceDate: 'asc' }
    });

    const payments = await prisma.vendorPayment.findMany({
       where: { organizationId, vendorId },
       orderBy: { paymentDate: 'asc' }
    });

    const transactions = [];

    for (const inv of invoices) {
       transactions.push({
          date: inv.invoiceDate,
          type: "INVOICE",
          reference: inv.invoiceNumber,
          amount: Number(inv.totalAmount),
          balanceImpact: Number(inv.totalAmount)
       });
    }

    for (const pay of payments) {
       transactions.push({
          date: pay.paymentDate,
          type: "PAYMENT",
          reference: pay.reference || "Payment",
          amount: Number(pay.amount),
          balanceImpact: -Number(pay.amount)
       });
    }

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statementLines = transactions.map(t => {
       runningBalance += t.balanceImpact;
       return {
          ...t,
          closingBalance: runningBalance
       };
    });

    return {
       vendorId,
       openingBalance: 0, // Assuming 0 for now
       transactions: statementLines,
       closingBalance: runningBalance
    };
  }
};
