import { z } from "zod";

const creditLimitSchema = z
  .preprocess((value) => (value === "" ? undefined : value), z.number().min(0))
  .optional();

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(30).optional(),
    gstNumber: z.string().min(3).max(32).optional(),
    address: z.string().max(255).optional(),
    creditLimit: creditLimitSchema,
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(30).optional(),
    gstNumber: z.string().min(3).max(32).optional(),
    address: z.string().max(255).optional(),
    creditLimit: creditLimitSchema,
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().max(120).optional(),
  }),
});
