export type Expense = {
  id: string;
  category: string;
  amount: number;
  expenseDate: string;
  description: string;
  vendorId?: string;
  workspaceId: string;
};

export type ExpensesPayload = {
  expenses: Expense[];
  summary: {
    totalExpenses: number;
    totalAmount: number;
  };
};
