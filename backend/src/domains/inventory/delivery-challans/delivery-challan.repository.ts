// @ts-nocheck
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../../config/database.js";
import { parsePagination } from "../../../../shared/utils/pagination.js";
import { CreateDeliveryChallanInput, DeliveryChallanFilters } from "./delivery-challan.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildChallanFilter = (organizationId: string, filters: DeliveryChallanFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.challanNumber = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.godownId) {
    where.godownId = filters.godownId;
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }
  return where;
};

export const challanRepository = {
  create: (organizationId: string, data: CreateDeliveryChallanInput, client?: DatabaseClient) => {
    return getClient(client).deliveryChallan.create({
      data: {
        organizationId,
        challanNumber: data.challanNumber,
        customerId: data.customerId,
        deliveryDate: data.deliveryDate,
        godownId: data.godownId,
        notes: data.notes,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });
  },

  updateStatus: (id: string, organizationId: string, status: "COMPLETED" | "CANCELLED", client?: DatabaseClient) => {
    return getClient(client).deliveryChallan.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status },
    });
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).deliveryChallan.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { include: { product: true } }, godown: true },
    });
  },

  findByChallanNumber: (challanNumber: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).deliveryChallan.findFirst({
      where: { challanNumber, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: DeliveryChallanFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildChallanFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.deliveryChallan.findMany({
          where,
          include: { godown: true },
          orderBy: { deliveryDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.deliveryChallan.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
