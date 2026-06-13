import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";

import type { BankReconciliationSchema } from "./schema";

type BackendTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE" | "PAYMENT" | "REFUND" | "PURCHASE" | "SALE";
  referenceType: string;
  referenceId: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

function mapTransaction(transaction: BackendTransaction) {
  const direction = (transaction.type === "INCOME" || transaction.type === "REFUND" || transaction.type === "SALE" ? "inflow" : "outflow") as "inflow" | "outflow";

  return {
    id: transaction.id,
    reference: transaction.referenceId.slice(0, 8).toUpperCase(),
    date: transaction.createdAt.slice(0, 10),
    kind: transaction.type === "PAYMENT" ? ("payment" as const) : transaction.type === "SALE" ? ("receipt" as const) : transaction.type === "PURCHASE" ? ("transfer" as const) : ("adjustment" as const),
    counterparty: transaction.referenceType,
    account: "General Ledger",
    amount: Number(transaction.amount),
    direction,
    status: "posted" as const,
    channel: "journal" as const,
    memo: transaction.description ?? "",
    workspaceId: "live",
  };
}

export async function getTransactions(page: number = 1, limit: number = 100) {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendTransaction>>>(apiEndpoints.transactions.list, {
    params: { page, limit },
  });

  const transactions = response.data.data.items.map(mapTransaction);

  return {
    summary: {
      totalTransactions: response.data.data.total,
      pendingTransactions: 0,
      exceptions: 0,
      netMovement: transactions.reduce((sum, transaction) => sum + (transaction.direction === "inflow" ? transaction.amount : transaction.amount * -1), 0),
    },
    transactions,
    meta: {
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
    },
    reconciliations: [] as any[],
    alerts: [] as any[],
  };
}

export async function getTransactionById(transactionId: string) {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendTransaction>>>(apiEndpoints.transactions.list, {
    params: { page: 1, limit: 100 },
  });

  const transaction = response.data.data.items.find((entry) => entry.id === transactionId);
  return transaction ? mapTransaction(transaction) : null;
}

export async function getReconciliations(): Promise<any[]> {
  return [];
}

export async function createBankReconciliation(_input: BankReconciliationSchema): Promise<any> {
  throw new Error("Bank reconciliation is not implemented by the backend API");
}
