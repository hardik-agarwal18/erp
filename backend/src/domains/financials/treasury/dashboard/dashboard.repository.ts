import { Prisma } from "@prisma/client";
import { prisma } from "../../../../config/database.js";

export const dashboardRepository = {
  getTreasuryDashboard: async (organizationId: string) => {
    // We get balances directly from the BankAccount model, assuming they will be updated by transactions
    // Actually, the user specifically requested:
    // "Do NOT store: currentBalance as the source of truth.
    // Instead: Opening Balance + Transactions = Current Balance"

    // So we need to calculate balances from BankTransaction and JournalEntry or just BankTransaction
    // Let's fetch all BankAccounts and their transactions to calculate the balance
    // In a real app, this might be a SQL view or calculated in service
    const accounts = await prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      include: { linkedAccount: true },
    });

    const accountIds = accounts.map(a => a.linkedAccountId);

    // Calculate balance from Journal Lines
    const journalLines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accountIds },
        entry: { isPosted: true },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return { accounts, journalLines };
  },

  getRecentTransfers: async (organizationId: string, limit: number = 5) => {
    return prisma.treasuryTransfer.findMany({
      where: { organizationId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        transferDate: "desc",
      },
      take: limit,
    });
  }
};
