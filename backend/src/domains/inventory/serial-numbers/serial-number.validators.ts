
import { z } from "zod";

export const getSerialNumbersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    productId: z.string().uuid().optional(),
    godownId: z.string().uuid().optional(),
    status: z.enum(["AVAILABLE", "SOLD", "RETURNED", "DAMAGED", "MISSING", "SCRAPPED"]).optional(),
    batchId: z.string().uuid().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  }),
});
