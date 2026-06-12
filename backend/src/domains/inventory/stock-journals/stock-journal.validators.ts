
import { z } from "zod";

const journalItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const createJournalSchema = z.object({
  body: z.object({
    journalNumber: z.string().min(1).max(50),
    fromGodownId: z.string().uuid(),
    toGodownId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z.array(journalItemSchema).min(1),
  }).refine((data) => data.fromGodownId !== data.toGodownId, {
    message: "Source and destination godowns must be different",
    path: ["toGodownId"],
  }),
});

export const postJournalSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      journalItemId: z.string().uuid(),
      serialNumberIds: z.array(z.string().uuid()).optional(),
    })).optional(),
  }).optional(),
});

export const listJournalsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
    godownId: z.string().uuid().optional(),
  }),
});
