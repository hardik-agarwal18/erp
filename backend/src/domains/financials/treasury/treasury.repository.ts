import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.js";
import {
  CreateBankAccountInput,
  CreateBankTransactionInput,
  BankTransactionFilters,
  UpdateBankAccountInput,
} from "./treasury.types.js";

export const treasuryRepository = {
  // --- Bank Accounts ---
  createBankAccount: async (organizationId: string, linkedAccountId: string, data: CreateBankAccountInput) => {
    return prisma.bankAccount.create({
      data: {
        organizationId,
        linkedAccountId,
        ...data,
      },
      include: {
        linkedAccount: true,
      },
    });
  },

  updateBankAccount: async (organizationId: string, id: string, data: UpdateBankAccountInput) => {
    return prisma.bankAccount.update({
      where: {
        id,
        organizationId,
      },
      data,
    });
  },

  getBankAccountById: async (organizationId: string, id: string) => {
    return prisma.bankAccount.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        linkedAccount: true,
      },
    });
  },

  listBankAccounts: async (organizationId: string) => {
    return prisma.bankAccount.findMany({
      where: {
        organizationId,
      },
      include: {
        linkedAccount: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  // --- Bank Transactions ---
  createBankTransaction: async (organizationId: string, data: CreateBankTransactionInput, journalEntryId?: string) => {
    return prisma.bankTransaction.create({
      data: {
        organizationId,
        bankAccountId: data.bankAccountId,
        type: data.type,
        amount: new Prisma.Decimal(data.amount.toString()),
        reference: data.reference,
        description: data.description,
        transactionDate: data.transactionDate,
        status: data.status || "CLEARED",
        journalEntryId,
      },
      include: {
        bankAccount: true,
      },
    });
  },

  getBankTransactionById: async (organizationId: string, id: string) => {
    return prisma.bankTransaction.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        bankAccount: true,
        journalEntry: true,
      },
    });
  },

  reconcileTransaction: async (transactionId: string) => {
    return prisma.bankTransaction.update({
      where: { id: transactionId },
      data: { status: "RECONCILED" }
    });
  },

  listBankTransactions: async (organizationId: string, filters: BankTransactionFilters) => {
    const where: Prisma.BankTransactionWhereInput = {
      organizationId,
    };

    if (filters.bankAccountId) {
      where.bankAccountId = filters.bankAccountId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        where.transactionDate.lte = endOfDay;
      }
    }

    return prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });
  },
};
