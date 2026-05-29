import { z } from "zod";

import { requiredTextSchema } from "@/schemas/shared";

export const stockAdjustmentSchema = z.object({
  sku: z.string().trim().min(4),
  warehouse: requiredTextSchema,
  quantity: z.number().positive(),
  direction: z.enum(["increase", "decrease"]),
  reason: z.enum(["cycle_count", "damage", "receipt_correction", "return", "production_issue"]),
  requestedBy: requiredTextSchema,
  note: z.string().trim().min(6),
});

export const stockTransferSchema = z.object({
  sku: z.string().trim().min(4),
  fromWarehouse: requiredTextSchema,
  toWarehouse: requiredTextSchema,
  quantity: z.number().positive(),
  eta: z.string().trim().min(8),
  requestedBy: requiredTextSchema,
});

export const inventoryAuditSchema = z.object({
  warehouse: requiredTextSchema,
  cycle: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  scope: requiredTextSchema,
  scheduledDate: z.string().trim().min(8),
  owner: requiredTextSchema,
});

export const warehouseSchema = z.object({
  name: requiredTextSchema,
  manager: requiredTextSchema,
  type: z.enum(["distribution", "plant", "staging"]),
  capacityUtilization: z.number().min(0).max(100),
  openBins: z.number().nonnegative(),
  pendingPutaways: z.number().nonnegative(),
  pickingAccuracy: z.number().min(0).max(100),
});

export type StockAdjustmentSchema = z.infer<typeof stockAdjustmentSchema>;
export type StockTransferSchema = z.infer<typeof stockTransferSchema>;
export type InventoryAuditSchema = z.infer<typeof inventoryAuditSchema>;
export type WarehouseSchema = z.infer<typeof warehouseSchema>;
