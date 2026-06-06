import type { Transaction, TransactionStatus } from "@/types/app";

export type ReconciliationStatus = "balanced" | "in_progress" | "attention";

export type ReconciliationEntry = {
  id: string;
  bankAccount: string;
  statementDate: string;
  statementBalance: number;
  ledgerBalance: number;
  unmatchedCount: number;
  variance: number;
  status: ReconciliationStatus;
  owner: string;
};

export type TransactionFiltersState = {
  search: string;
  status: TransactionStatus | "all";
};

export type TransactionSummary = {
  totalTransactions: number;
  pendingTransactions: number;
  exceptions: number;
  netMovement: number;
};

export type TransactionsPayload = {
  summary: TransactionSummary;
  transactions: Transaction[];
  reconciliations: ReconciliationEntry[];
  alerts: Array<{ id: string; title: string; detail: string; tone: "danger" | "warning" | "info" }>;
};

export type BankReconciliationFormValues = {
  bankAccount: string;
  statementDate: string;
  statementBalance: number;
  ledgerBalance: number;
  owner: string;
};
