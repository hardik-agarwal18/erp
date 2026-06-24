
import prisma from "../../../config/database.js";
import logger from "../../../config/logger.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { expenseRepository } from "./expense.repository.js";
import { CreateExpenseInput } from "./expense.types.js";
import { accountingService } from "../accounting/accounting.service.js";
import { vendorQueryService } from "../../contacts/vendors/vendor.query-service.js";

export const expenseService = {
  createExpense: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateExpenseInput,
  ) => {
    if (payload.vendorId) {
      const vendor = await vendorQueryService.findById(organizationId, payload.vendorId);
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
          bankAccountId: payload.bankAccountId,
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

      logger.info({ action: "expense.create", expenseId: created.id, amount: payload.amount }, "Expense created");

      return created;
    });

    try {
      await accountingService.postExpenseJournal(
        organizationId,
        expense.id,
        payload.description || `Expense: ${payload.category}`,
        payload.amount,
        payload.category
      );
    } catch (error) {
      logger.error({ error, expenseId: expense.id }, "Failed to post expense journal");
    }

    return expense;
  },

  listExpenses: (
    organizationId: string,
    filters: { category?: string; vendorId?: string; startDate?: string; endDate?: string },
    query: Record<string, unknown>,
  ) => {
    return expenseRepository.listExpenses(organizationId, filters, query);
  },

  getExpenseById: async (organizationId: string, expenseId: string) => {
    const expense = await expenseRepository.findById(organizationId, expenseId);
    if (!expense) throw new ApiError(404, "Expense not found");
    return expense;
  },

  updateExpense: async (
    organizationId: string,
    actorUserId: string,
    expenseId: string,
    payload: Partial<CreateExpenseInput>,
  ) => {
    const expense = await expenseRepository.findById(organizationId, expenseId);
    if (!expense) throw new ApiError(404, "Expense not found");

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: payload,
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.EXPENSE_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
    });

    logger.info({ action: "expense.update", expenseId, amount: updated.amount }, "Expense updated");

    return updated;
  },

  deleteExpense: async (
    organizationId: string,
    actorUserId: string,
    expenseId: string,
  ) => {
    const expense = await expenseRepository.findById(organizationId, expenseId);
    if (!expense) throw new ApiError(404, "Expense not found");

    await prisma.expense.update({
      where: { id: expenseId },
      data: { deletedAt: new Date() },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.EXPENSE_DELETED,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
    });

    logger.info({ action: "expense.delete", expenseId }, "Expense deleted");
  },
};
