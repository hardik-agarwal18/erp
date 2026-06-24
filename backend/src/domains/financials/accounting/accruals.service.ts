import prisma from "../../../config/database.js";
import { accountingService } from "./accounting.service.js";

export const accrualsService = {
  /**
   * Sweeps for any JournalEntry where isAccrual = true, reversedByEntryId is null,
   * and autoReversalDate is <= the given target date (usually today).
   */
  processPendingAccruals: async (organizationId: string, targetDate: Date = new Date()) => {
    const pendingAccruals = await prisma.journalEntry.findMany({
      where: {
        organizationId,
        isPosted: true,
        isAccrual: true,
        reversedByEntryId: null,
        autoReversalDate: { lte: targetDate }
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    for (const accrual of pendingAccruals) {
      try {
        await accountingService.reverseJournalEntry(organizationId, accrual.id, accrual.autoReversalDate || targetDate);
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({ id: accrual.id, error: err.message });
      }
    }

    return {
      successCount,
      failureCount,
      errors
    };
  }
};
