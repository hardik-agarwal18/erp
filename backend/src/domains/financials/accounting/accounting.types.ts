
import { AccountType, BalanceType, Prisma } from "@prisma/client";

export interface CreateAccountInput {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: BalanceType;
  parentId?: string;
  isSystem?: boolean;
}

export interface JournalLineInput {
  accountId: string;
  debit: number | any;
  credit: number | any;
  description?: string;
}

export interface CreateJournalEntryInput {
  description: string;
  referenceType?: string;
  referenceId?: string;
  sourceEventId?: string;
  postedAt?: Date;
  lines: JournalLineInput[];
  isAccrual?: boolean;
  autoReversalDate?: Date;
}

export interface TrialBalanceFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAccountInput {
  name?: string;
  description?: string;
}

export interface JournalFilters {
  startDate?: Date;
  endDate?: Date;
  referenceType?: string;
  page?: number;
  limit?: number;
}

export interface CreateFiscalYearInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface TrialBalanceResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: Prisma.Decimal;
  totalCredit: Prisma.Decimal;
  netBalance: Prisma.Decimal; // For Assets/Expenses: Debit - Credit. For Liab/Eq/Rev: Credit - Debit.
}
