// @ts-nocheck
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../../config/database.js";
import { parsePagination } from "../../../../shared/utils/pagination.js";
import { CreateGodownInput, GodownFilters, UpdateGodownInput } from "./godown.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildGodownFilter = (organizationId: string, filters: GodownFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  return where;
};

export const godownRepository = {
  create: (organizationId: string, data: CreateGodownInput, client?: DatabaseClient) => {
    return getClient(client).godown.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  update: (id: string, organizationId: string, data: UpdateGodownInput, client?: DatabaseClient) => {
    return getClient(client).godown.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  delete: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).godown.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).godown.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  },

  findByName: (name: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).godown.findFirst({
      where: { name, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: GodownFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildGodownFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.godown.findMany({
          where,
          orderBy: { name: "asc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.godown.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
