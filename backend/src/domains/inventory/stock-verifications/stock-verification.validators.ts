// @ts-nocheck
import { z } from "zod";

const verificationItemSchema = z.object({
  productId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  expectedQty: z.number().min(0),
});

export const createVerificationSchema = z.object({
  body: z.object({
    verificationNumber: z.string().min(1).max(50),
    godownId: z.string().uuid(),
    scheduledDate: z.string().datetime(),
    notes: z.string().max(1000).optional(),
    items: z.array(verificationItemSchema).min(1),
  }),
});

const completeVerificationItemSchema = z.object({
  id: z.string().uuid(),
  physicalQty: z.number().min(0),
  missingSerialIds: z.array(z.string().uuid()).optional(),
  foundSerialNumbers: z.array(z.string()).optional(),
});

export const completeVerificationSchema = z.object({
  body: z.object({
    items: z.array(completeVerificationItemSchema).min(1),
  }),
});

export const listVerificationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
    status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED"]).optional(),
    godownId: z.string().uuid().optional(),
  }),
});
