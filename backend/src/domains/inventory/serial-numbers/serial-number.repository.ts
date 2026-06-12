// @ts-nocheck
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { SerialNumberFilters } from "./serial-number.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildFilters = (organizationId: string, filters: SerialNumberFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
  };
  if (filters.search) {
    where.serialNumber = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.productId) {
    where.productId = filters.productId;
  }
  if (filters.godownId) {
    where.godownId = filters.godownId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.batchId) {
    where.batchId = filters.batchId;
  }
  return where;
};

export const serialNumberRepository = {
  list: (organizationId: string, filters: SerialNumberFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildFilters(organizationId, filters);

    return prisma
      .$transaction([
        prisma.serialNumber.findMany({
          where,
          include: {
            product: true,
            godown: true,
            batch: true,
          },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.serialNumber.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).serialNumber.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        godown: true,
        batch: true,
      },
    });
  },

  findBySerialNumber: (serialNumber: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).serialNumber.findFirst({
      where: { serialNumber, organizationId },
      include: {
        product: true,
        godown: true,
        batch: true,
      },
    });
  },
};
