import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().refine((value) => value !== 0),
    paymentMethod: z.enum([
      "CASH",
      "BANK_TRANSFER",
      "UPI",
      "CARD",
      "CHEQUE",
      "OTHER",
    ]),
    paymentDate: z.string().datetime(),
    reference: z.string().max(120).optional(),
  }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    invoiceId: z.string().uuid().optional(),
  }),
});
