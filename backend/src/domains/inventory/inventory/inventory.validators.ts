// @ts-nocheck
import { z } from "zod";

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number(),
    referenceId: z.string().max(120).optional(),
  }),
});

export const transferStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    referenceId: z.string().max(120).optional(),
  }),
});

export const listInventoryItemsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
  }),
});

export const listInventoryMovementsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    productId: z.string().uuid().optional(),
  }),
});
