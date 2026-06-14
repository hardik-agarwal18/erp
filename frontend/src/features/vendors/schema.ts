import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const vendorFormSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  legalName: z.string().trim().optional().or(z.literal("")),
  email: z.union([z.string().trim().email("Invalid email"), z.literal("")]),
  phone: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "review", "inactive"]),
  category: z.enum(["raw_materials", "services", "logistics", "electronics"]),
  gstin: z.string().trim().optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3),
  paymentTerms: z.coerce.number().int().nonnegative().optional(),
  leadTimeDays: z.coerce.number().nonnegative().optional(),
  accountManager: z.string().trim().optional().or(z.literal("")),
  billingAddress: z.string().trim().optional().or(z.literal("")),
  shippingAddress: z.string().trim().optional().or(z.literal("")),
});

export type VendorFormSchema = z.infer<typeof vendorFormSchema>;
