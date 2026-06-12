// @ts-nocheck
import { z } from "zod";

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    date: z.string().datetime("Must be a valid ISO datetime string"),
    isOptional: z.boolean().optional(),
  }),
});

export const updateHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    date: z.string().datetime().optional(),
    isOptional: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid holiday ID"),
  }),
});

export const getHolidaysSchema = z.object({
  query: z.object({
    year: z.string().regex(/^\d{4}$/, "Must be a valid 4-digit year").optional(),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/, "Must be a valid month (1-12)").optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getHolidayByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid holiday ID"),
  }),
});

export const deleteHolidaySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid holiday ID"),
  }),
});