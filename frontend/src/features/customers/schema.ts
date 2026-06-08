import { z } from "zod";

import { currencySchema, requiredTextSchema } from "@/schemas/shared";

export const customerFormSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  legalName: z.string().trim().optional().or(z.literal("")),
  email: z.union([z.string().trim().email("Invalid email"), z.literal("")]),
  phone: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "at_risk", "inactive"]),
  segment: z.enum(["enterprise", "mid_market", "smb"]),
  gstin: z.string().trim().optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
  creditLimit: z.coerce.number().nonnegative().optional(),
  owner: z.string().trim().optional().or(z.literal("")),
  billingAddress: z.string().trim().optional().or(z.literal("")),
  shippingAddress: z.string().trim().optional().or(z.literal("")),
});

export type CustomerFormSchema = z.infer<typeof customerFormSchema>;
