
import { z } from "zod";

export const createGodownSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    code: z.string().max(50).optional(),
    address: z.string().max(1000).optional(),
    managerId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateGodownSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().max(50).optional(),
    address: z.string().max(1000).optional(),
    managerId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listGodownsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    isActive: z.string().optional(),
  }),
});
