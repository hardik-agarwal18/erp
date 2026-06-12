// @ts-nocheck
import { AccountType } from "@prisma/client";

export interface CreateAccountInput {
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  isSystem?: boolean;
}

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryInput {
  description: string;
  referenceType?: string;
  referenceId?: string;
  postedAt?: Date;
  lines: JournalLineInput[];
}

export interface TrialBalanceFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface TrialBalanceResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  netBalance: number; // For Assets/Expenses: Debit - Credit. For Liab/Eq/Rev: Credit - Debit.
}
