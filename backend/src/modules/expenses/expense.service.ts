import prisma from "../../config/database.js";
import ApiError from "../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../services/audit/index.js";
import { expenseRepository } from "./expense.repository.js";
import { CreateExpenseInput } from "./expense.types.js";

export const expenseService = {
  createExpense: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateExpenseInput,
  ) => {
    if (payload.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { id: payload.vendorId, organizationId, deletedAt: null },
      });
      if (!vendor) {
        throw new ApiError(404, "Vendor not found");
      }
    }

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          organizationId,
          vendorId: payload.vendorId,
          category: payload.category,
          amount: payload.amount,
          expenseDate: new Date(payload.expenseDate),
          description: payload.description,
        },
      });

      await tx.transaction.create({
        data: {
          organizationId,
          type: "EXPENSE",
          referenceType: "expense",
          referenceId: created.id,
          amount: payload.amount,
          description: `Expense: ${payload.category}`,
        },
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.EXPENSE_CREATED,
          entityType: AUDIT_ENTITY_TYPES.EXPENSE,
          entityId: created.id,
        },
        tx,
      );

      return created;
    });

    return expense;
  },

  listExpenses: (
    organizationId: string,
    filters: { category?: string; vendorId?: string },
    query: Record<string, unknown>,
  ) => {
    return expenseRepository.listExpenses(organizationId, filters, query);
  },
};
