import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
const p: any = prisma;
import { parsePagination } from "../../../shared/utils/pagination.js";

export const debitNoteRepository = {
  createDebitNoteWithItems: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      customerId: string;
      debitNoteNumber: string;
      status: "DRAFT" | "POSTED";
      issueDate: Date;
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
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
    const created = await (tx as any).debitNote.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        noteNumber: payload.debitNoteNumber,
        status: payload.status,
        issueDate: payload.issueDate,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        notes: payload.notes,
      },
    });

    await (tx as any).debitNoteItem.createMany({
      data: payload.items.map((item) => ({
        debitNoteId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: 0,
        total: item.lineTotal,
      })),
    });

    return created;
  },

  listDebitNotes: async (organizationId: string, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.debitNote.findMany({
        where,
        include: { customer: true },
        orderBy: { issueDate: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.debitNote.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },
};
