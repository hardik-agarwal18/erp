import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const invoiceLineItemSchema = z.object({
  description: requiredTextSchema,
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative(),
});

export const invoiceFormSchema = z.object({
  customer: requiredTextSchema,
  invoiceNumber: z.string().trim().min(5),
  issueDate: z.string().trim().min(8),
  dueDate: z.string().trim().min(8),
  salesRep: requiredTextSchema,
  paymentTerms: z.number().int().nonnegative(),
  notes: z.string().trim().min(4),
  billingAddress: requiredTextSchema,
  lineItems: z.array(invoiceLineItemSchema).min(1),
});

export type InvoiceFormSchema = z.infer<typeof invoiceFormSchema>;
