import { z } from "zod";
export enum ExpenseClaimStatus { PENDING="PENDING", APPROVED="APPROVED", REJECTED="REJECTED", PAID="PAID", REIMBURSED="REIMBURSED" }

export const submitClaimSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    category: z.string().min(2),
    amount: z.number().positive(),
    currency: z.string().optional(),
    description: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export const updateClaimStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ExpenseClaimStatus),
  }),
});

