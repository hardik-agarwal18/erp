import { z } from "zod";

import { currencySchema, requiredTextSchema } from "@/schemas/shared";

export const customerFormSchema = z.object({
  code: z.string().trim().min(4),
  name: requiredTextSchema,
  legalName: requiredTextSchema,
  email: z.string().trim().email(),
  phone: z.string().trim().min(8),
  status: z.enum(["active", "at_risk", "inactive"]),
  segment: z.enum(["enterprise", "mid_market", "smb"]),
  gstin: z.string().trim().min(10),
  currency: z.string().trim().min(3).max(3),
  paymentTerms: requiredTextSchema,
  creditLimit: currencySchema.min(0),
  owner: requiredTextSchema,
  billingAddress: requiredTextSchema,
  shippingAddress: requiredTextSchema,
});

export type CustomerFormSchema = z.infer<typeof customerFormSchema>;
