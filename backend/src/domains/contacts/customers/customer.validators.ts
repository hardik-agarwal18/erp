import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    type: z.enum(["INDIVIDUAL", "CORPORATE"]),
    group: z.string().max(50).optional(),
    gstNumber: z.string().min(3).max(32).optional(),
    parentCustomerId: z.string().uuid().optional(),
    addresses: z.array(
      z.object({
        type: z.enum(["BILLING", "SHIPPING", "OTHER"]),
        street: z.string().max(255),
        city: z.string().max(100),
        state: z.string().max(100),
        country: z.string().max(100),
        postalCode: z.string().max(20),
        isDefault: z.boolean().optional(),
      })
    ).optional(),
    contacts: z.array(
      z.object({
        name: z.string().max(100),
        email: z.string().email().optional(),
        phone: z.string().max(30).optional(),
        role: z.string().max(50).optional(),
        isPrimary: z.boolean().optional(),
      })
    ).optional(),
    taxProfile: z.object({
      panNumber: z.string().max(50).optional(),
      taxExempt: z.boolean().optional(),
      exemptionReason: z.string().max(255).optional(),
    }).optional(),
    creditProfile: z.object({
      creditLimit: z.number().min(0),
      creditDays: z.number().min(0),
      riskRating: z.string().max(50).optional(),
    }).optional()
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    type: z.enum(["INDIVIDUAL", "CORPORATE"]).optional(),
    group: z.string().max(50).optional(),
    gstNumber: z.string().min(3).max(32).optional(),
    parentCustomerId: z.string().uuid().optional(),
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
    status: z.string().optional(),
    type: z.string().optional(),
  }),
});
