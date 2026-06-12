
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreateStockGroupInput, StockGroupFilters, UpdateStockGroupInput } from "./stock-group.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildStockGroupFilter = (organizationId: string, filters: StockGroupFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId;
  }
  return where;
};

export const stockGroupRepository = {
  create: (organizationId: string, data: CreateStockGroupInput, client?: DatabaseClient) => {
    return getClient(client).stockGroup.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  update: (id: string, organizationId: string, data: UpdateStockGroupInput, client?: DatabaseClient) => {
    return getClient(client).stockGroup.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  delete: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockGroup.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockGroup.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  },

  findByName: (name: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockGroup.findFirst({
      where: { name, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: StockGroupFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildStockGroupFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.stockGroup.findMany({
          where,
          include: { parent: true },
          orderBy: { name: "asc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.stockGroup.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
