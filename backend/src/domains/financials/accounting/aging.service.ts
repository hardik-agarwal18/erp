import { prisma } from "../../../config/database.js";
import { Prisma } from "@prisma/client";

export interface AgingBucket {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  total: number;
}

export const agingService = {
  getAccountsReceivableAging: async (organizationId: string, asOfDate: Date = new Date()): Promise<AgingBucket> => {
    // Fetch all unpaid or partially paid sales invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ["RECEIVED", "POSTED", "PARTIALLY_PAID", "OVERDUE"] as any } as any,
        issueDate: { lte: asOfDate }
      },
      // Removed allocations because it's not in the schema anymore
    });

    const bucket: AgingBucket = { current: 0, days1To30: 0, days31To60: 0, days61To90: 0, days90Plus: 0, total: 0 };

    for (const inv of invoices) {
      // For AR without detailed allocations mapped, we assume the full totalAmount is due if not PAID
      const balance = inv.totalAmount.toNumber();
      
      if (balance <= 0) continue;

      const dueDate = inv.dueDate || inv.issueDate;
      const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      bucket.total += balance;

      if (daysOverdue <= 0) {
        bucket.current += balance;
      } else if (daysOverdue <= 30) {
        bucket.days1To30 += balance;
      } else if (daysOverdue <= 60) {
        bucket.days31To60 += balance;
      } else if (daysOverdue <= 90) {
        bucket.days61To90 += balance;
      } else {
        bucket.days90Plus += balance;
      }
    }

    return bucket;
  },

  getAccountsPayableAging: async (organizationId: string, asOfDate: Date = new Date()): Promise<AgingBucket> => {
    // Fetch all unpaid vendor invoices
    // Note: Vendor invoices might track payments differently depending on the schema,
    // assuming they also use a status and possibly a payments/allocations array.
    // If we don't have an allocations array on VendorInvoice, we can rely on status for now.
    const vendorInvoices = await prisma.vendorInvoice.findMany({
      where: {
        organizationId,
        status: { notIn: ["DRAFT" as any, "RECEIVED" as any] } as any, // Adjust statuses as needed
        invoiceDate: { lte: asOfDate }
      }
    });

    const bucket: AgingBucket = { current: 0, days1To30: 0, days31To60: 0, days61To90: 0, days90Plus: 0, total: 0 };

    for (const inv of vendorInvoices) {
      // For AP without detailed allocations mapped, we assume the full totalAmount is due if not PAID
      const balance = inv.totalAmount.toNumber();

      if (balance <= 0) continue;

      const dueDate = inv.dueDate || inv.invoiceDate;
      const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      bucket.total += balance;

      if (daysOverdue <= 0) {
        bucket.current += balance;
      } else if (daysOverdue <= 30) {
        bucket.days1To30 += balance;
      } else if (daysOverdue <= 60) {
        bucket.days31To60 += balance;
      } else if (daysOverdue <= 90) {
        bucket.days61To90 += balance;
      } else {
        bucket.days90Plus += balance;
      }
    }

    return bucket;
  }
};
