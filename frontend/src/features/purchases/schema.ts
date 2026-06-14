import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const purchaseLineItemSchema = z.object({
  description: requiredTextSchema,
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const purchaseOrderSchema = z.object({
  vendor: requiredTextSchema,
  number: z.string().trim().min(5),
  orderDate: z.string().trim().min(8),
  expectedDate: z.string().trim().min(8),
  warehouse: requiredTextSchema,
  approvalStage: requiredTextSchema,
  paymentTerms: z.number().int().nonnegative(),
  buyer: requiredTextSchema,
  notes: z.string().trim().min(4),
  lineItems: z.array(purchaseLineItemSchema).min(1),
});

export const goodsReceivedNoteSchema = z.object({
  purchaseOrderNumber: z.string().trim().min(5),
  vendor: requiredTextSchema,
  warehouse: requiredTextSchema,
  receivedDate: z.string().trim().min(8),
  receivedBy: requiredTextSchema,
  itemsReceived: z.number().positive(),
});

export type PurchaseOrderSchema = z.infer<typeof purchaseOrderSchema>;
export type GoodsReceivedNoteSchema = z.infer<typeof goodsReceivedNoteSchema>;

export const vendorPaymentFormSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  reference: z.string().optional(),
  bankAccountId: z.string().optional(),
});

export type VendorPaymentFormSchema = z.infer<typeof vendorPaymentFormSchema>;