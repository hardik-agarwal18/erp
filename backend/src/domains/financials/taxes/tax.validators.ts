// @ts-nocheck
import { z } from "zod";

export const createTaxSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    rate: z.number().min(0).max(100),
    type: z.enum(["GST", "VAT", "SALES_TAX", "OTHER"]),
    isDefault: z.boolean().optional(),
  }),
});

export const updateTaxSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    rate: z.number().min(0).max(100).optional(),
    type: z.enum(["GST", "VAT", "SALES_TAX", "OTHER"]).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const taxIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listTaxesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
  }),
});
