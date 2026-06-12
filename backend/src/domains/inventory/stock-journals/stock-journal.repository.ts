// @ts-nocheck
import { Prisma } from "@prisma/client";
import prisma, { type DatabaseTransactionClient } from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreateStockJournalInput, StockJournalFilters } from "./stock-journal.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildJournalFilter = (organizationId: string, filters: StockJournalFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.search) {
    where.journalNumber = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.godownId) {
    where.OR = [
      { fromGodownId: filters.godownId },
      { toGodownId: filters.godownId },
    ];
  }
  return where;
};

export const journalRepository = {
  create: (organizationId: string, data: CreateStockJournalInput, client?: DatabaseClient) => {
    return getClient(client).stockJournal.create({
      data: {
        organizationId,
        journalNumber: data.journalNumber,
        fromGodownId: data.fromGodownId,
        toGodownId: data.toGodownId,
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
    return getClient(client).stockJournal.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status },
    });
  },

  findById: (id: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockJournal.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { include: { product: true } }, fromGodown: true, toGodown: true },
    });
  },

  findByJournalNumber: (journalNumber: string, organizationId: string, client?: DatabaseClient) => {
    return getClient(client).stockJournal.findFirst({
      where: { journalNumber, organizationId, deletedAt: null },
    });
  },

  list: (organizationId: string, filters: StockJournalFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildJournalFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.stockJournal.findMany({
          where,
          include: { fromGodown: true, toGodown: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.stockJournal.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
