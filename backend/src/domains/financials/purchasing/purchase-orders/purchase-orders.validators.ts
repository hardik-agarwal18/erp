
import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    vendorId: z.string().uuid(),
    expectedDeliveryDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    currencyCode: z.string().length(3).optional(),
    exchangeRate: z.number().positive().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxAmount: z.number().nonnegative().optional(),
        discountAmount: z.number().nonnegative().optional(),
      })
    ).min(1),
  }),
});
