import { z } from "zod";

export const createExpenseSchema = z.object({
  body: z.object({
    vendorId: z.string().uuid().optional(),
    category: z.enum([
      "SALARY",
      "RENT",
      "UTILITIES",
      "MARKETING",
      "TRAVEL",
      "SOFTWARE",
      "OTHER",
    ]),
    amount: z.number().min(0),
    expenseDate: z.string().datetime(),
    description: z.string().max(500).optional(),
  }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z
      .enum([
        "SALARY",
        "RENT",
        "UTILITIES",
        "MARKETING",
        "TRAVEL",
        "SOFTWARE",
        "OTHER",
      ])
      .optional(),
    vendorId: z.string().uuid().optional(),
  }),
});
