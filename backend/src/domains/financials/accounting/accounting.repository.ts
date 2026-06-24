import { prisma } from "../../../config/database.js";
import { CreateAccountInput, CreateJournalEntryInput } from "./accounting.types.js";
import { AccountType, Prisma } from "@prisma/client";
import { accountingPeriodValidator } from "./period-validator.service.js";

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

  updateAccount: async (organizationId: string, id: string, data: { name?: string; description?: string }) => {
    return prisma.account.update({
      where: { id, organizationId },
      data,
    });
  },

  listAccounts: async (organizationId: string) => {
    return prisma.account.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: "asc" },
    });
  },

  // JOURNALS
  // Removed findBySourceEventId as sourceEventId doesn't exist

  createJournalEntry: async (organizationId: string, data: CreateJournalEntryInput) => {
    await accountingPeriodValidator.validateDateOpen(organizationId, data.postedAt || new Date());

    // Generate a simple entry number if not sequence driven, or we can use UUID for now
    const entryNumber = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.journalEntry.create({
      data: {
        organizationId,
        entryNumber,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        sourceEventId: data.sourceEventId,
        isPosted: true,
        postedAt: data.postedAt || new Date(),
        isAccrual: data.isAccrual || false,
        autoReversalDate: data.autoReversalDate,
        lines: {
          create: data.lines.map((line) => ({
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit.toString()),
            credit: new Prisma.Decimal(line.credit.toString()),
            description: line.description
          }))
        },
      } as any,
      include: {
        lines: true,
      },
    });
  },

  updateJournalEntry: async (organizationId: string, id: string, data: any) => {
    const journal = await prisma.journalEntry.findUnique({ where: { id, organizationId } });
    if (!journal) throw new Error("Journal not found");
    if (journal.isPosted) {
      throw new Error("Posted journals cannot be edited. Please reverse the journal instead.");
    }
    
    return prisma.journalEntry.update({
      where: { id, organizationId },
      data,
    });
  },

  reverseJournalEntry: async (organizationId: string, id: string, reversalDate?: Date) => {
    const targetDate = reversalDate || new Date();
    await accountingPeriodValidator.validateDateOpen(organizationId, targetDate);

    return prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!original) throw new Error("Journal not found");
      if (!original.isPosted) {
        throw new Error("Only posted journals can be reversed.");
      }

      // 1. Create reversal journal
      const reversalNumber = `REV-${original.entryNumber}`;
      const reversal = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber: reversalNumber,
          description: `Reversal of ${original.entryNumber}: ${original.description}`,
          referenceType: original.referenceType,
          referenceId: original.referenceId,
          isPosted: true,
          postedAt: reversalDate || new Date(),
          isReversal: true,
          reversesEntryId: original.id,
          lines: {
            create: original.lines.map(line => ({
              accountId: line.accountId,
              // Swap debits and credits
              debit: line.credit as any,
              credit: line.debit as any,
            } as any)),
          },
        },
        include: { lines: true },
      });

      // 2. Mark original as reversed
      await tx.journalEntry.update({
        where: { id: original.id },
        data: { reversedByEntryId: reversal.id }
      });

      return reversal;
    });
  },

  getJournalEntriesByReference: async (organizationId: string, referenceType: string, referenceId: string) => {
    return prisma.journalEntry.findMany({
      where: { organizationId, referenceType, referenceId },
      include: { lines: true },
    });
  },

  listJournals: async (organizationId: string, filters: { startDate?: Date; endDate?: Date; referenceType?: string; accountId?: string; page?: number; limit?: number }) => {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters.accountId) {
      where.lines = {
        some: { accountId: filters.accountId }
      };
    }

    if (filters.startDate || filters.endDate) {
      where.postedAt = {};
      if (filters.startDate) where.postedAt.gte = filters.startDate;
      if (filters.endDate) where.postedAt.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: { lines: { include: { account: true } } },
        orderBy: { postedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  getJournalById: async (organizationId: string, id: string) => {
    return prisma.journalEntry.findUnique({
      where: { id, organizationId },
      include: { lines: { include: { account: true } } },
    });
  },

  // Removed getJournalBySourceEventId

  // TRIAL BALANCE
  getTrialBalance: async (organizationId: string, startDate?: Date, endDate?: Date) => {
    const entryWhere: Prisma.JournalEntryWhereInput = {
      organizationId,
      isPosted: true,
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = startDate;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = endOfDay;
      }
      entryWhere.postedAt = dateFilter;
    }

    const matchingEntries = await prisma.journalEntry.findMany({
      where: entryWhere,
      select: { id: true },
    });
    const entryIds = matchingEntries.map(e => e.id);

    const lines = await prisma.journalLine.groupBy({
      by: ["accountId"],
      _sum: {
        debit: true,
        credit: true,
      },
      where: {
        entryId: { in: entryIds },
      },
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

      const debit = new Prisma.Decimal(line._sum.debit ? line._sum.debit.toString() : 0);
      const credit = new Prisma.Decimal(line._sum.credit ? line._sum.credit.toString() : 0);
      let netBalance = new Prisma.Decimal(0);

      if (account.type === "ASSET" || account.type === "EXPENSE") {
        netBalance = debit.minus(credit);
      } else {
        netBalance = credit.minus(debit);
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
  createFiscalYear: async (organizationId: string, name: string, startDate: Date, endDate: Date, isActive: boolean = true) => {
    return prisma.fiscalYear.create({
      data: {
        organizationId,
        name,
        startDate,
        endDate,
        isActive,
      },
    });
  },

  listFiscalYears: async (organizationId: string) => {
    return prisma.fiscalYear.findMany({
      where: { organizationId },
      orderBy: { startDate: "desc" },
    });
  },

  getActiveFiscalYear: async (organizationId: string) => {
    return prisma.fiscalYear.findFirst({
      where: { organizationId, isActive: true, isClosed: false },
      orderBy: { startDate: "desc" },
    });
  },

  // PERIODS
  getAccountingPeriodForDate: async (organizationId: string, date: Date) => {
    return prisma.accountingPeriod.findFirst({
      where: {
        organizationId,
        startDate: { lte: date },
        endDate: { gte: date },
      }
    });
  },

  // MAPPINGS
  getDefaultAccountMapping: async (organizationId: string): Promise<any> => {
    // DefaultAccountMapping model removed
    return null as any;
  }
};
