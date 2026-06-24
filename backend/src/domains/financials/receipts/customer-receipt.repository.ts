import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
const p: any = prisma;
import { parsePagination } from "../../../shared/utils/pagination.js";

export const customerReceiptRepository = {
  createReceipt: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      customerId: string;
      receiptNumber: string;
      receiptDate: Date;
      amount: number;
      unallocatedAmount: number;
      paymentMethod: string;
      reference?: string;
      receivedIntoAccountId: string;
      status: "UNALLOCATED" | "PARTIALLY_ALLOCATED" | "ALLOCATED";
    }
  ) => {
    return (tx as any).customerReceipt.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        receiptNumber: payload.receiptNumber,
        receiptDate: payload.receiptDate,
        amount: payload.amount,
        unallocatedAmount: payload.unallocatedAmount,
        paymentMethod: payload.paymentMethod,
        reference: payload.reference,
        receivedIntoAccountId: payload.receivedIntoAccountId,
        status: payload.status,
      },
    });
  },

  createAllocation: async (
    tx: DatabaseTransactionClient,
    receiptId: string,
    invoiceId: string,
    allocatedAmount: number
  ) => {
    return (tx as any).receiptAllocation.create({
      data: {
        receiptId,
        invoiceId,
        allocatedAmount,
      },
    });
  },

  findInvoiceForAllocation: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string
  ) => {
    return tx.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
        deletedAt: null,
      },
    });
  },

  updateInvoiceAmountPaid: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string,
    allocatedAmount: number
  ) => {
    // We increment amountPaid and decrement amountDue
    return tx.invoice.updateMany({
      where: { id: invoiceId, organizationId },
      data: {
        amountPaid: { increment: allocatedAmount },
        amountDue: { decrement: allocatedAmount },
      } as any,
    });
  },

  updateInvoiceStatus: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string,
    status: "PARTIALLY_PAID" | "PAID"
  ) => {
    return tx.invoice.updateMany({
      where: { id: invoiceId, organizationId },
      data: { status },
    });
  },

  listReceipts: async (organizationId: string, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.customerReceipt.findMany({
        where,
        include: { customer: true, allocations: true },
        orderBy: { receiptDate: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.customerReceipt.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },
};
