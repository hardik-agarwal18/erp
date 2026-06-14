
export type CreateExpenseInput = {
  vendorId?: string;
  category:
    | "SALARY"
    | "RENT"
    | "UTILITIES"
    | "MARKETING"
    | "TRAVEL"
    | "SOFTWARE"
    | "OTHER";
  amount: number;
  expenseDate: string;
  description?: string;
  bankAccountId?: string;
};
