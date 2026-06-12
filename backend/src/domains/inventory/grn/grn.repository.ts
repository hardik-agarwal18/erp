
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreateGRNInput, GRNFilters } from "./grn.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildGRNFilter = (organizationId: string, filters: GRNFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.grnNumber = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.godownId) {
    where.godownId = filters.godownId;
  }
  if (filters.vendorId) {
    where.vendorId = filters.vendorId;
  }
  return where;
};

export const grnRepository = {
  create: (organizationId: string, data: CreateGRNInput, client?: DatabaseClient) => {
    return getClient(client).goodsReceiptNote.create({
      data: {
        organizationId,
        grnNumber: data.grnNumber,
        purchaseOrderId: data.purchaseOrderId,
        vendorId: data.vendorId,
        receivedDate: data.receivedDate,
        godownId: data.godownId,
        notes: data.notes,
        items: {
          create: data.items.map(i => ({
            productId: i.productId,
            poItemId: i.poItemId,
            orderedQty: i.orderedQty,
            receivedQty: i.receivedQty,
            batchId: i.batchId,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  },

  updateStatus: (id: string, organizationId: string, status: "COMPLETED" | "CANCELLED", client?: DatabaseClient) => {
    return getClient(client).goodsReceiptNote.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status },
    });
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).goodsReceiptNote.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { include: { product: true } }, godown: true },
    });
  },

  findByGrnNumber: (grnNumber: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).goodsReceiptNote.findFirst({
      where: { grnNumber, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: GRNFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildGRNFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.goodsReceiptNote.findMany({
          where,
          include: { godown: true },
          orderBy: { receivedDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.goodsReceiptNote.count({ where }),
      ])
      .then(([items, total]: [any, number]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
