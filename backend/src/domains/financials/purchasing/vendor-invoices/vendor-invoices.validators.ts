// @ts-nocheck
import { z } from "zod";

export const createVendorInvoiceSchema = z.object({
  body: z.object({
    vendorId: z.string().uuid(),
    purchaseOrderId: z.string().uuid().optional(),
    invoiceNumber: z.string().min(1),
    invoiceDate: z.string().datetime(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        poItemId: z.string().uuid().optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxAmount: z.number().nonnegative().optional(),
        discountAmount: z.number().nonnegative().optional(),
      })
    ).min(1),
  }),
});
