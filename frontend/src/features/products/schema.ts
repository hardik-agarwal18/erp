import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const productFormSchema = z.object({
  code: z.string().trim().min(4),
  sku: z.string().trim().min(4),
  name: requiredTextSchema,
  description: z.string().trim().min(8),
  status: z.enum(["active", "draft", "discontinued"]),
  type: z.enum(["raw_material", "finished_good", "consumable", "service"]),
  category: requiredTextSchema,
  unitOfMeasure: z.string().trim().min(2).max(10),
  barcode: z.string().trim().min(6),
  taxCode: z.string().trim().min(2),
  supplierName: requiredTextSchema,
  supplierCode: z.string().trim().min(3),
  supplierLeadTimeDays: z.number().nonnegative(),
  supplierMinimumOrderQuantity: z.number().nonnegative(),
  supplierPaymentTerms: z.number().int().nonnegative(),
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  wholesalePrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative(),
  openingOnHand: z.number().nonnegative(),
  reservedStock: z.number().nonnegative(),
  incomingStock: z.number().nonnegative(),
  reorderPoint: z.number().nonnegative(),
  safetyStock: z.number().nonnegative(),
  primaryWarehouse: requiredTextSchema,
  primaryBin: requiredTextSchema,
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;
