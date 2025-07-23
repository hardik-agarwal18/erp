import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const vendorFormSchema = z.object({
  code: z.string().trim().min(4),
  name: requiredTextSchema,
  legalName: requiredTextSchema,
  email: z.string().trim().email(),
  phone: z.string().trim().min(8),
  status: z.enum(["active", "review", "inactive"]),
  category: z.enum(["raw_materials", "services", "logistics", "electronics"]),
  gstin: z.string().trim().min(10),
  currency: z.string().trim().min(3).max(3),
  paymentTerms: requiredTextSchema,
  leadTimeDays: z.number().nonnegative(),
  accountManager: requiredTextSchema,
  billingAddress: requiredTextSchema,
  shippingAddress: requiredTextSchema,
});

export type VendorFormSchema = z.infer<typeof vendorFormSchema>;
