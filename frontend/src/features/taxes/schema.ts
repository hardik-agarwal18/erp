import { z } from "zod";

export const taxFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate cannot exceed 100"),
  type: z.enum(["GST", "VAT", "SALES_TAX", "OTHER"]),
  isDefault: z.boolean().default(false),
});

export type TaxFormSchema = z.infer<typeof taxFormSchema>;
