import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
const p: any = prisma;
import { parsePagination } from "../../../shared/utils/pagination.js";

export const creditNoteRepository = {
  createCreditNoteWithItems: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      customerId: string;
      creditNoteNumber: string;
      status: "DRAFT" | "POSTED";
      issueDate: Date;
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
      unappliedAmount: number;
      notes?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        taxAmount: number;
        lineTotal: number;
      }>;
    }
  ) => {
    const created = await (tx as any).creditNote.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        noteNumber: payload.creditNoteNumber,
        status: payload.status,
        issueDate: payload.issueDate,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        unappliedAmount: payload.unappliedAmount,
        notes: payload.notes,
      },
    });

    await (tx as any).creditNoteItem.createMany({
      data: payload.items.map((item) => ({
        creditNoteId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: 0,
        total: item.lineTotal,
      })),
    });

    return created;
  },

  applyCreditNote: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    creditNoteId: string,
    invoiceId: string,
    appliedAmount: number
  ) => {
    // Increment amountPaid, decrement amountDue on Invoice
    await (tx as any).invoice.updateMany({
      where: { id: invoiceId, organizationId },
      data: {
        amountPaid: { increment: appliedAmount },
        amountDue: { decrement: appliedAmount },
      },
    });

    // Create CreditNoteApplication
    return (tx as any).creditNoteApplication.create({
      data: {
        creditNoteId,
        invoiceId,
        appliedAmount,
      },
    });
  },

  listCreditNotes: async (organizationId: string, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.creditNote.findMany({
        where,
        include: { customer: true, applications: true },
        orderBy: { issueDate: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.creditNote.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },
};
