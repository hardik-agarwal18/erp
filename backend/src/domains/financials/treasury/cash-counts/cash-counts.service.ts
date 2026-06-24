import { cashCountsRepository } from "./cash-counts.repository.js";
import { treasuryRepository } from "../treasury.repository.js";
import { accountingService } from "../../accounting/accounting.service.js";
import { accountingRepository } from "../../accounting/accounting.repository.js";
import ApiError from "../../../../utils/ApiError.js";
import { Prisma } from "@prisma/client";
import { 
  emitCashCountCreated, 
  emitCashCountPosted, 
  emitCashCountVoided, 
  emitCashVarianceDetected 
} from "../../../../shared/events/event-bus.js";

export const cashCountsService = {
  createCashCount: async (organizationId: string, userId: string, data: any) => {
    const bankAccount = await treasuryRepository.getBankAccountById(organizationId, data.bankAccountId);
    if (!bankAccount) {
      throw new ApiError(404, "Bank Account not found");
    }
    
    if (bankAccount.isFrozen || bankAccount.closedAt) {
      throw new ApiError(400, "Cannot perform cash count on a frozen or closed account.");
    }

    if (bankAccount.type !== "CASH" && bankAccount.type !== "PETTY_CASH") {
      throw new ApiError(400, "Cash counts can only be performed on CASH or PETTY_CASH accounts.");
    }

    const countNumber = await cashCountsRepository.getNextCountNumber(organizationId);

    const cashCount = await cashCountsRepository.createCashCount(organizationId, countNumber, {
      ...data,
      status: "DRAFT", // always create as DRAFT first
    });

    emitCashCountCreated({ organizationId, cashCountId: cashCount.id });

    return cashCount;
  },

  postCashCount: async (organizationId: string, cashCountId: string, userId: string) => {
    const cashCount = await cashCountsRepository.getCashCountById(organizationId, cashCountId);
    if (!cashCount) {
      throw new ApiError(404, "Cash Count not found");
    }

    if (cashCount.status !== "DRAFT") {
      throw new ApiError(400, "Only DRAFT cash counts can be posted.");
    }

    let journalEntryId = undefined;

    const variance = Number(cashCount.varianceAmount);

    if (variance !== 0) {
      // Fetch system accounts
      const accounts = await accountingRepository.listAccounts(organizationId);
      
      // Look for mapped accounts first, if mapping service is used. 
      // For now, we search by name/code convention as requested by user system accounts
      let varianceExpenseAccount = accounts.find((a: any) => a.code === "CASH_VARIANCE_EXPENSE" || a.name === "Cash Variance Expense");
      let varianceIncomeAccount = accounts.find((a: any) => a.code === "CASH_VARIANCE_INCOME" || a.name === "Cash Variance Income");

      if (!varianceExpenseAccount) {
        varianceExpenseAccount = await accountingRepository.createAccount(organizationId, {
          code: "CASH_VARIANCE_EXPENSE",
          name: "Cash Variance Expense",
          type: "EXPENSE",
          normalBalance: "DEBIT",
          isSystem: true,
        });
      }

      if (!varianceIncomeAccount) {
        varianceIncomeAccount = await accountingRepository.createAccount(organizationId, {
          code: "CASH_VARIANCE_INCOME",
          name: "Cash Variance Income",
          type: "REVENUE",
          normalBalance: "CREDIT",
          isSystem: true,
        });
      }

      const lines = [];

      if (variance < 0) {
        // Shortage
        // Dr Cash Variance Expense
        // Cr Petty Cash
        const absVariance = Math.abs(variance);
        lines.push({
          accountId: varianceExpenseAccount.id,
          debit: absVariance,
          credit: 0,
          description: `Cash Shortage for Count ${cashCount.countNumber}`,
        });
        lines.push({
          accountId: cashCount.bankAccount.linkedAccountId,
          debit: 0,
          credit: absVariance,
          description: `Cash Shortage for Count ${cashCount.countNumber}`,
        });
      } else {
        // Overage
        // Dr Petty Cash
        // Cr Cash Variance Income
        lines.push({
          accountId: cashCount.bankAccount.linkedAccountId,
          debit: variance,
          credit: 0,
          description: `Cash Overage for Count ${cashCount.countNumber}`,
        });
        lines.push({
          accountId: varianceIncomeAccount.id,
          debit: 0,
          credit: variance,
          description: `Cash Overage for Count ${cashCount.countNumber}`,
        });
      }

      const journalEntry = await accountingService.postJournalEntry(organizationId, {
        description: `Cash Variance for Count ${cashCount.countNumber}`,
        referenceType: "CASH_COUNT",
        referenceId: cashCount.countNumber,
        postedAt: cashCount.countDate,
        lines,
      });

      journalEntryId = journalEntry.id;
      emitCashVarianceDetected({ organizationId, cashCountId });
    }

    const updateData: any = { status: "POSTED" };
    if (journalEntryId) {
      updateData.journalEntryId = journalEntryId;
    }

    const updated = await cashCountsRepository.updateCashCount(organizationId, cashCountId, updateData);

    emitCashCountPosted({ organizationId, cashCountId });

    return updated;
  },

  voidCashCount: async (organizationId: string, cashCountId: string, userId: string) => {
    const cashCount = await cashCountsRepository.getCashCountById(organizationId, cashCountId);
    if (!cashCount) {
      throw new ApiError(404, "Cash Count not found");
    }

    if (cashCount.status === "VOID") {
      throw new ApiError(400, "Cash Count is already voided.");
    }
    
    if (cashCount.status === "POSTED" && cashCount.journalEntryId) {
      // In a real system, you would reverse the journal entry, similar to transfers
      // For now, we'll just throw an error or handle reversal
      throw new ApiError(400, "Cannot void a posted cash count that has a variance. Reverse the journal entry first.");
    }

    const updated = await cashCountsRepository.updateCashCount(organizationId, cashCountId, {
      status: "VOID",
    });

    emitCashCountVoided({ organizationId, cashCountId });

    return updated;
  },

  listCashCounts: async (organizationId: string, filters: any) => {
    return cashCountsRepository.listCashCounts(organizationId, filters);
  },
  
  getCashCountById: async (organizationId: string, id: string) => {
    return cashCountsRepository.getCashCountById(organizationId, id);
  }
};
