
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreateStockVerificationInput, StockVerificationFilters } from "./stock-verification.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildVerificationFilter = (organizationId: string, filters: StockVerificationFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.verificationNumber = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.godownId) {
    where.godownId = filters.godownId;
  }
  return where;
};

export const verificationRepository = {
  create: (organizationId: string, data: CreateStockVerificationInput, client?: DatabaseClient) => {
    return getClient(client).stockVerification.create({
      data: {
        organizationId,
        verificationNumber: data.verificationNumber,
        godownId: data.godownId,
        scheduledDate: data.scheduledDate,
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

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockVerification.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { include: { product: true } }, godown: true },
    });
  },

  findByVerificationNumber: (verificationNumber: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockVerification.findFirst({
      where: { verificationNumber, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: StockVerificationFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildVerificationFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.stockVerification.findMany({
          where,
          include: { godown: true },
          orderBy: { scheduledDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.stockVerification.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
