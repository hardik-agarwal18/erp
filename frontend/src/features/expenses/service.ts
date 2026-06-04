import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Expense, ExpensesPayload } from "./types";
import type { ExpenseFormSchema } from "./schema";

type BackendExpense = {
  id: string;
  organizationId: string;
  vendorId: string | null;
  category: string;
  amount: number;
  expenseDate: string;
  description: string | null;
  createdAt: string;
};

function mapBackendExpense(expense: BackendExpense): Expense {
  return {
    id: expense.id,
    category: expense.category,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate.slice(0, 10),
    description: expense.description ?? "",
    vendorId: expense.vendorId ?? undefined,
    workspaceId: expense.organizationId,
  };
}

export async function getExpenses() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendExpense>>>(apiEndpoints.expenses.list, {
    params: { page: 1, limit: 100 },
  });

  const expenses = response.data.data.items.map(mapBackendExpense);

  const payload: ExpensesPayload = {
    expenses,
    summary: {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    },
  };

  return payload;
}

export async function getExpenseById(expenseId: string) {
  const response = await apiClient.get<ApiResponse<BackendExpense>>(apiEndpoints.expenses.details(expenseId));
  return mapBackendExpense(response.data.data);
}

export async function createExpense(input: ExpenseFormSchema) {
  const response = await apiClient.post<ApiResponse<BackendExpense>>(apiEndpoints.expenses.list, input);
  return mapBackendExpense(response.data.data);
}

export async function updateExpense(expenseId: string, input: ExpenseFormSchema) {
  const response = await apiClient.put<ApiResponse<BackendExpense>>(apiEndpoints.expenses.details(expenseId), input);
  return mapBackendExpense(response.data.data);
}

export async function deleteExpense(expenseId: string) {
  await apiClient.delete(apiEndpoints.expenses.details(expenseId));
}
