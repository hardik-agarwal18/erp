// @ts-nocheck
import { z } from "zod";

const priceSchema = z.number().min(0);

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    sku: z.string().max(64).optional(),
    description: z.string().max(500).optional(),
    unit: z.string().max(32).optional(),
    sellingPrice: priceSchema,
    purchasePrice: priceSchema.optional(),
    taxId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(["PHYSICAL", "SERVICE"]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    sku: z.string().max(64).optional(),
    description: z.string().max(500).optional(),
    unit: z.string().max(32).optional(),
    sellingPrice: priceSchema.optional(),
    purchasePrice: priceSchema.optional(),
    taxId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(["PHYSICAL", "SERVICE"]).optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    type: z.enum(["PHYSICAL", "SERVICE"]).optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(255).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(255).optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
  }),
});
