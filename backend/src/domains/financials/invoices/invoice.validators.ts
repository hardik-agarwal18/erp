
import { z } from "zod";

export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    sourceType: z.enum(["SALES_ORDER", "DELIVERY_CHALLAN"]).optional(),
    salesOrderId: z.string().uuid().optional(),
    deliveryChallanId: z.string().uuid().optional(),
    issueDate: z.string().datetime(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(["DRAFT", "POSTED"]).optional(),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          unitPrice: z.number().min(0).optional(),
          discountAmount: z.number().min(0).optional(),
        }),
      )
      .min(1),
  }),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    customerId: z.string().uuid().optional(),
    issueDate: z.string().datetime().optional(),
    status: z.enum(["DRAFT", "POSTED", "VOID"]).optional(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          unitPrice: z.number().min(0).optional(),
          discountAmount: z.number().min(0).optional(),
        }),
      )
      .min(1)
      .optional(),
  }),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum([
        "DRAFT",
        "POSTED",
        "PAID",
        "PARTIALLY_PAID",
        "OVERDUE",
        "VOID",
        "WRITTEN_OFF",
      ])
      .optional(),
    search: z.string().max(120).optional(),
  }),
});

export const sendInvoiceEmailSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email(),
  }),
});
