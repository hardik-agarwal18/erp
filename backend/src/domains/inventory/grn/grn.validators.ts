import { z } from "zod";

const grnItemSchema = z.object({
  productId: z.string().uuid(),
  poItemId: z.string().uuid().optional(),
  orderedQuantity: z.number().positive().optional(),
  receivedQuantity: z.number().positive(),
  batchId: z.string().optional(),
  unitPrice: z.number().min(0),
});

export const createGRNSchema = z.object({
  body: z.object({
    grnNumber: z.string().min(1).max(50),
    vendorId: z.string().uuid().optional(),
    purchaseOrderId: z.string().uuid().optional(),
    receivedDate: z.string().datetime().optional(),
    godownId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z.array(grnItemSchema).min(1),
  }),
});

export const listGRNSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.enum(["DRAFT", "INSPECTING", "RECEIVED", "POSTED", "CANCELLED"]).optional(),
    godownId: z.string().uuid().optional(),
    vendorId: z.string().uuid().optional(),
  }),
});
