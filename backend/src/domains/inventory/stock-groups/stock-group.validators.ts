
import { z } from "zod";

export const createStockGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    parentId: z.string().uuid().optional(),
  }),
});

export const updateStockGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    parentId: z.string().uuid().nullable().optional(),
  }),
});

export const listStockGroupsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    parentId: z.string().uuid().optional(),
  }),
});
