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
  paymentTerms: requiredTextSchema,
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
