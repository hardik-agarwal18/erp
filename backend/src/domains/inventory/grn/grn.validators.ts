
import { z } from "zod";

const grnItemSchema = z.object({
  productId: z.string().uuid(),
  orderedQty: z.number().positive().optional(),
  receivedQty: z.number().positive(),
  batchMode: z.enum(["SELECT_EXISTING", "CREATE_NEW"]).optional(),
  batchId: z.string().uuid().optional(),
  batchNumber: z.string().optional(),
  manufactureDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  unitPrice: z.number().min(0),
  serialNumbers: z.array(z.string()).optional(),
});

export const createGRNSchema = z.object({
  body: z.object({
    grnNumber: z.string().min(1).max(50),
    vendorId: z.string().uuid().optional(),
    receivedDate: z.string().datetime(),
    godownId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z.array(grnItemSchema).min(1),
  }),
});

export const receiveGRNSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      grnItemId: z.string().uuid(),
      serialNumbers: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
});

export const listGRNSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
    godownId: z.string().uuid().optional(),
    vendorId: z.string().uuid().optional(),
  }),
});
