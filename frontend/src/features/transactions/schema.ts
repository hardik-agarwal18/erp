import { z } from "zod";

import { currencySchema, requiredTextSchema } from "@/schemas/shared";

export const bankReconciliationSchema = z.object({
  bankAccount: requiredTextSchema,
  statementDate: z.string().trim().min(8),
  statementBalance: currencySchema,
  ledgerBalance: currencySchema,
  owner: requiredTextSchema,
});

export type BankReconciliationSchema = z.infer<typeof bankReconciliationSchema>;
