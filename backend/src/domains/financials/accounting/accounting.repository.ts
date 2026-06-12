
import { prisma } from "../../../config/database.js";
import { CreateAccountInput, CreateJournalEntryInput } from "./accounting.types.js";
import { AccountType, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const accountingRepository = {
  // ACCOUNTS
  createAccount: async (organizationId: string, data: CreateAccountInput) => {
    return prisma.account.create({
      data: {
        organizationId,
        ...data,
      },
    });
  },

  getAccountByCode: async (organizationId: string, code: string) => {
    return prisma.account.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
  },

  getSystemAccount: async (organizationId: string, name: string) => {
    return prisma.account.findFirst({
      where: { organizationId, name, isSystem: true, isActive: true },
    });
  },

  listAccounts: async (organizationId: string) => {
    return prisma.account.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: "asc" },
    });
  },

  // JOURNALS
  createJournalEntry: async (organizationId: string, data: CreateJournalEntryInput) => {
    // Generate a simple entry number if not sequence driven, or we can use UUID for now
    const entryNumber = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.journalEntry.create({
      data: {
        organizationId,
        entryNumber,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        postedAt: data.postedAt || new Date(),
        lines: {
          create: data.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  },

  getJournalEntriesByReference: async (organizationId: string, referenceType: string, referenceId: string) => {
    return prisma.journalEntry.findMany({
      where: { organizationId, referenceType, referenceId },
      include: { lines: true },
    });
  },

  // TRIAL BALANCE
  getTrialBalance: async (organizationId: string, startDate?: Date, endDate?: Date) => {
    const whereClause: Prisma.JournalLineWhereInput = {
      entry: {
        organizationId,
        isPosted: true,
      },
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      
      whereClause.entry = {
        ...whereClause.entry,
        postedAt: dateFilter,
      };
    }

    const lines = await prisma.journalLine.groupBy({
      by: ["accountId"],
      _sum: {
        debit: true,
        credit: true,
      },
      where: whereClause,
    });

    // Get account details
    const accounts = await prisma.account.findMany({
      where: { organizationId },
      select: { id: true, code: true, name: true, type: true },
    });

    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const result = lines.map((line) => {
      const account = accountMap.get(line.accountId);
      if (!account) return null;

      const debit = Number(line._sum.debit || 0);
      const credit = Number(line._sum.credit || 0);
      let netBalance = 0;

      if (account.type === "ASSET" || account.type === "EXPENSE") {
        netBalance = debit - credit;
      } else {
        netBalance = credit - debit;
      }

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        totalDebit: debit,
        totalCredit: credit,
        netBalance,
      };
    }).filter(Boolean);

    return result;
  },

  // FISCAL YEAR
  createFiscalYear: async (organizationId: string, name: string, startDate: Date, endDate: Date) => {
    return prisma.fiscalYear.create({
      data: {
        organizationId,
        name,
        startDate,
        endDate,
      },
    });
  },

  getActiveFiscalYear: async (organizationId: string) => {
    return prisma.fiscalYear.findFirst({
      where: { organizationId, isActive: true, isClosed: false },
      orderBy: { startDate: "desc" },
    });
  }
};
