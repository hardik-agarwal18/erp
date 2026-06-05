import prisma from "../../config/database.js";
import { BaseRepository } from "../../database/base.repository.js";
import { parsePagination } from "../../shared/utils/pagination.js";
import { CreateExpenseInput } from "./expense.types.js";

const expenseCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.expense.create>>,
  Parameters<typeof prisma.expense.create>[0]["data"],
  Parameters<typeof prisma.expense.update>[0]["data"]
>(prisma.expense, {
  softDelete: true,
  tenantScoped: true,
});

export const expenseRepository = {
  createExpense: (organizationId: string, payload: CreateExpenseInput) => {
    return expenseCrudRepository.create({
      organizationId,
      vendorId: payload.vendorId,
      category: payload.category,
      amount: payload.amount,
      expenseDate: new Date(payload.expenseDate),
      description: payload.description,
    });
  },
  listExpenses: (
    organizationId: string,
    filters: { category?: string; vendorId?: string },
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = {
      organizationId,
      deletedAt: null,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
    };

    return prisma
      .$transaction([
        prisma.expense.findMany({
          where,
          orderBy: { expenseDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
          include: { vendor: true },
        }),
        prisma.expense.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
};
