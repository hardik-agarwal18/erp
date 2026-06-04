import { z } from "zod";

export const expenseFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  expenseDate: z.string().min(1, "Expense date is required"),
  description: z.string().optional(),
  vendorId: z.string().optional(),
});

export type ExpenseFormSchema = z.infer<typeof expenseFormSchema>;
