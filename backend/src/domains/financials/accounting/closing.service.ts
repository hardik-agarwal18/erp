import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import { accountingService } from "./accounting.service.js";

export const closingService = {
  closeAccountingPeriod: async (organizationId: string, periodId: string, actorUserId: string) => {
    return prisma.$transaction(async (tx: any) => {
      const period = await tx.accountingPeriod.findFirst({
        where: { id: periodId, organizationId }
      });

      if (!period) throw new ApiError(404, "Accounting Period not found");
      if (period.isClosed) throw new ApiError(400, "Period is already closed");

      // Check if there are any unposted journals in this period date range
      const unpostedJournals = await tx.journalEntry.count({
         where: {
            organizationId,
            isPosted: false,
            createdAt: { gte: period.startDate, lte: period.endDate } // Approximating transaction date using createdAt
         }
      });

      if (unpostedJournals > 0) {
         throw new ApiError(400, `Cannot close period. There are ${unpostedJournals} unposted journal entries in this period range.`);
      }

      const updated = await tx.accountingPeriod.update({
         where: { id: period.id },
         data: {
            isClosed: true,
            closedAt: new Date(),
            closedById: actorUserId
         }
      });

      return updated;
    });
  },

  closeFiscalYear: async (organizationId: string, fiscalYearId: string, actorUserId: string) => {
    return prisma.$transaction(async (tx: any) => {
      const fiscalYear = await tx.fiscalYear.findFirst({
        where: { id: fiscalYearId, organizationId },
        include: { periods: true }
      });

      if (!fiscalYear) throw new ApiError(404, "Fiscal Year not found");
      if (fiscalYear.isClosed) throw new ApiError(400, "Fiscal Year is already closed");

      // Verify all periods are closed
      const openPeriods = fiscalYear.periods.filter((p: any) => !p.isClosed);
      if (openPeriods.length > 0) {
         throw new ApiError(400, "Cannot close Fiscal Year because some accounting periods are still open.");
      }

      // Sweep Revenue and Expense accounts to Retained Earnings
      // 1. Find the Retained Earnings account
      let retainedEarningsAcc = await tx.account.findFirst({
         where: { organizationId, type: "EQUITY", name: "Retained Earnings" }
      });

      if (!retainedEarningsAcc) {
         // Create dynamically if not found
         retainedEarningsAcc = await tx.account.create({
            data: {
               organizationId,
               code: "3999", // dynamic fallback
               name: "Retained Earnings",
               type: "EQUITY",
               normalBalance: "CREDIT",
               isActive: true,
               isSystem: true
            }
         });
      }

      // 2. Compute the balance for all REVENUE and EXPENSE accounts
      const accountsToSweep = await tx.account.findMany({
         where: { 
            organizationId, 
            type: { in: ["REVENUE", "EXPENSE"] },
            isActive: true
         }
      });

      let totalNetIncome = 0; // Credit positive
      const closingLines = [];

      for (const account of accountsToSweep) {
         // Query the sum of debits and credits
         const lines = await tx.journalLine.aggregate({
            _sum: { debit: true, credit: true },
            where: {
               accountId: account.id,
               journalEntry: {
                  isPosted: true,
                  organizationId,
                  createdAt: { gte: fiscalYear.startDate, lte: fiscalYear.endDate }
               }
            }
         });

         const totalDebit = Number(lines._sum.debit || 0);
         const totalCredit = Number(lines._sum.credit || 0);

         // We want to bring the account balance to zero.
         // If it's a Revenue account (normal Credit), its balance is Credit - Debit. To zero it, we debit it.
         // If it's an Expense account (normal Debit), its balance is Debit - Credit. To zero it, we credit it.
         
         const balance = account.normalBalance === "CREDIT" ? (totalCredit - totalDebit) : (totalDebit - totalCredit);
         
         if (balance === 0) continue;

         if (account.normalBalance === "CREDIT") {
            // It has a credit balance, debit it
            closingLines.push({ accountId: account.id, debit: balance, credit: 0, description: "Year-End Closing Sweep" });
            totalNetIncome += balance;
         } else {
            // It has a debit balance, credit it
            closingLines.push({ accountId: account.id, debit: 0, credit: balance, description: "Year-End Closing Sweep" });
            totalNetIncome -= balance;
         }
      }

      if (closingLines.length > 0) {
         // Post the net difference to Retained Earnings
         if (totalNetIncome > 0) {
            closingLines.push({ accountId: retainedEarningsAcc.id, debit: 0, credit: totalNetIncome, description: "Net Income to Retained Earnings" });
         } else if (totalNetIncome < 0) {
            closingLines.push({ accountId: retainedEarningsAcc.id, debit: Math.abs(totalNetIncome), credit: 0, description: "Net Loss to Retained Earnings" });
         }

         // Verify debits == credits
         const sumD = closingLines.reduce((s, l) => s + l.debit, 0);
         const sumC = closingLines.reduce((s, l) => s + l.credit, 0);
         if (Math.abs(sumD - sumC) > 0.01) {
            throw new ApiError(500, `Sweep verification failed: Debits ${sumD} != Credits ${sumC}`);
         }

         await tx.journalEntry.create({
            data: {
               organizationId,
               entryNumber: `YE-CLOSE-${fiscalYear.name.toUpperCase().replace(/\s/g, "")}`,
               description: `Year-End Closing Journal for ${fiscalYear.name}`,
               referenceType: "YEAR_END_CLOSE",
               referenceId: fiscalYear.id,
               isPosted: true,
               postedAt: new Date(),
               createdAt: fiscalYear.endDate, // post on the last day of the fiscal year
               lines: { create: closingLines }
            }
         });
      }

      return tx.fiscalYear.update({
         where: { id: fiscalYear.id },
         data: {
            isClosed: true,
            closedAt: new Date(),
            closedById: actorUserId
         }
      });
    });
  }
};
