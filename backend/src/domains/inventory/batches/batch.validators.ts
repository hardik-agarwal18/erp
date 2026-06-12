// @ts-nocheck
import { z } from "zod";

export const getBatchesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    godownId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    status: z.enum(["ACTIVE", "EXPIRING", "EXPIRED"]).optional(),
    expiryFrom: z.string().datetime().optional(),
    expiryTo: z.string().datetime().optional(),
  }),
});

export const getExpiringBatchesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    days: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getExpiredBatchesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getBatchMovementsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
