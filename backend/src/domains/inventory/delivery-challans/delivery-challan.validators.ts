
import { z } from "zod";

const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const createChallanSchema = z.object({
  body: z.object({
    challanNumber: z.string().min(1).max(50),
    customerId: z.string().uuid().optional(),
    deliveryDate: z.string().datetime(),
    godownId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z.array(challanItemSchema).min(1),
  }),
});

export const dispatchChallanSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      challanItemId: z.string().uuid(),
      serialNumberIds: z.array(z.string().uuid()).optional(),
    })).optional(),
  }).optional(),
});

export const listChallansSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
    godownId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
  }),
});
