import prisma, { DatabaseTransactionClient } from "../../../config/database.js";
import { CreateQuotationInput } from "./quotation.types.js";
import { Prisma } from "@prisma/client";

export const quotationRepository = {
  createQuotation: async (
    organizationId: string,
    quotationNumber: string,
    payload: CreateQuotationInput,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    
    let subtotal = new Prisma.Decimal(0);
    let taxTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);

    const lines = payload.lines.map((line) => {
      const lineSubtotal = new Prisma.Decimal(line.quantity).mul(line.unitPrice);
      const lineTax = lineSubtotal.mul(line.taxRate ?? 0).div(100);
      const lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);
      total = total.add(lineTotal);

      return {
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate ?? 0,
        total: lineTotal,
      };
    });

    // Create Quotation and its first Revision (R1)
    const quotation = await db.quotation.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        quotationNumber,
        issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
        revisions: {
          create: {
            revisionNumber: 1,
            status: "DRAFT",
            issueDate: new Date(payload.issueDate),
            validUntil: new Date(payload.validUntil),
            expiresAutomatically: payload.expiresAutomatically ?? true,
            notes: payload.notes,
            subtotal,
            taxTotal,
            total,
            lines: {
              create: lines
            }
          }
        }
      },
      include: {
        revisions: true
      }
    });

    const activeRevision = quotation.revisions[0];

    // Update activeRevisionId
    await db.quotation.update({
      where: { id: quotation.id },
      data: { activeRevisionId: activeRevision.id }
    });

    return db.quotation.findUniqueOrThrow({
      where: { id: quotation.id },
      include: {
        revisions: {
          include: {
            lines: true
          }
        }
      }
    });
  },

  getQuotationById: async (
    organizationId: string,
    id: string,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    return db.quotation.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            lines: true
          }
        }
      }
    });
  },

  createRevision: async (
    organizationId: string,
    quotationId: string,
    revisionNumber: number,
    payload: {
      issueDate: Date;
      validUntil: Date;
      expiresAutomatically: boolean;
      notes?: string;
      lines: any[];
    },
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;

    let subtotal = new Prisma.Decimal(0);
    let taxTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);

    const lines = payload.lines.map((line) => {
      const lineSubtotal = new Prisma.Decimal(line.quantity).mul(line.unitPrice);
      const lineTax = lineSubtotal.mul(line.taxRate ?? 0).div(100);
      const lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);
      total = total.add(lineTotal);

      return {
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate ?? 0,
        total: lineTotal,
      };
    });

    const revision = await db.quotationRevision.create({
      data: {
        quotationId,
        revisionNumber,
        status: "DRAFT",
        issueDate: payload.issueDate,
        validUntil: payload.validUntil,
        expiresAutomatically: payload.expiresAutomatically,
        notes: payload.notes,
        subtotal,
        taxTotal,
        total,
        lines: {
          create: lines
        }
      },
      include: { lines: true }
    });

    // Update activeRevisionId to the latest
    await db.quotation.update({
      where: { id: quotationId },
      data: { activeRevisionId: revision.id }
    });

    return revision;
  },

  updateRevisionStatus: async (
    organizationId: string,
    revisionId: string,
    status: import("@prisma/client").QuotationRevisionStatus,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    return db.quotationRevision.update({
      where: { id: revisionId },
      data: { status }
    });
  },

  listQuotations: async (
    organizationId: string,
    filters: { search?: string; status?: string; customerId?: string },
    pagination: { page?: number; limit?: number },
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.QuotationWhereInput = {
      organizationId,
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.search && {
        OR: [
          { quotationNumber: { contains: filters.search, mode: "insensitive" } },
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
      // Status filtering needs to filter based on the active revision's status
      ...(filters.status && {
        revisions: {
          some: {
            status: filters.status as any,
          }
        }
      })
    };

    const [data, total] = await Promise.all([
      db.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          revisions: {
            orderBy: { revisionNumber: "desc" },
            take: 1
          }
        },
      }),
      db.quotation.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
};
