import { z } from "zod";

const quotationLineSchema = z.object({
  productId: z.string().uuid(),
  description: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
});

export const createQuotationSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    issueDate: z.string().datetime(),
    validUntil: z.string().datetime(),
    expiresAutomatically: z.boolean().optional(),
    notes: z.string().optional(),
    lines: z.array(quotationLineSchema).min(1),
  }),
});

export const createQuotationRevisionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    issueDate: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    expiresAutomatically: z.boolean().optional(),
    notes: z.string().optional(),
    lines: z.array(quotationLineSchema).min(1).optional(),
  }),
});

export const quotationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listQuotationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.string().optional(),
    customerId: z.string().uuid().optional(),
  }),
});
