import prisma from "../../config/database.js";
import { parsePagination } from "../../shared/utils/pagination.js";
import { TransactionFilters } from "./transaction.types.js";

export const transactionRepository = {
  listTransactions: (
    organizationId: string,
    filters: TransactionFilters,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = {
      organizationId,
      ...(filters.type ? { type: filters.type } : {}),
    };

    return prisma
      .$transaction([
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.transaction.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
