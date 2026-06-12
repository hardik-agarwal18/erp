// @ts-nocheck
import { z } from "zod";

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z
      .enum(["INCOME", "EXPENSE", "PAYMENT", "REFUND", "PURCHASE", "SALE"])
      .optional(),
  }),
});
