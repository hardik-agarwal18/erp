import type { InventoryItem } from "@/types/app";

export type InventorySummaryItem = {
  label: string;
  value: string;
  detail: string;
  tone?: "danger" | "warning" | "neutral" | "success";
};

export type InventoryAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
};

export type StockAdjustmentReason = "cycle_count" | "damage" | "receipt_correction" | "return" | "production_issue";
export type StockAdjustmentDirection = "increase" | "decrease";
export type StockAdjustmentStatus = "posted" | "pending_review";

export type StockAdjustment = {
  id: string;
  itemName: string;
  sku: string;
  warehouse: string;
  quantity: number;
  direction: StockAdjustmentDirection;
  reason: StockAdjustmentReason;
  requestedBy: string;
  approvedBy: string;
  status: StockAdjustmentStatus;
  postedAt: string;
};

export type StockTransferStatus = "draft" | "in_transit" | "received";

export type StockTransfer = {
  id: string;
  reference: string;
  itemName: string;
  sku: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  status: StockTransferStatus;
  eta: string;
  requestedBy: string;
};

export type InventoryAuditStatus = "scheduled" | "in_progress" | "completed";

export type InventoryAudit = {
  id: string;
  warehouse: string;
  cycle: "daily" | "weekly" | "monthly" | "quarterly";
  scope: string;
  scheduledDate: string;
  owner: string;
  varianceUnits: number;
  status: InventoryAuditStatus;
};

export type WarehouseStatus = "healthy" | "attention" | "constrained";

export type WarehouseNode = {
  id: string;
  name: string;
  manager: string;
  type: "distribution" | "plant" | "staging";
  capacityUtilization: number;
  openBins: number;
  pendingPutaways: number;
  pickingAccuracy: number;
  status: WarehouseStatus;
};

export type StockAdjustmentFormValues = {
  sku: string;
  warehouse: string;
  quantity: number;
  direction: StockAdjustmentDirection;
  reason: StockAdjustmentReason;
  requestedBy: string;
  note: string;
};

export type StockTransferFormValues = {
  sku: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  eta: string;
  requestedBy: string;
};

export type InventoryAuditFormValues = {
  warehouse: string;
  cycle: InventoryAudit["cycle"];
  scope: string;
  scheduledDate: string;
  owner: string;
};

export type WarehouseFormValues = {
  name: string;
  manager: string;
  type: WarehouseNode["type"];
  capacityUtilization: number;
  openBins: number;
  pendingPutaways: number;
  pickingAccuracy: number;
};

export type InventoryManagementPayload = {
  summary: InventorySummaryItem[];
  items: InventoryItem[];
  alerts: InventoryAlert[];
  adjustments: StockAdjustment[];
  transfers: StockTransfer[];
  audits: InventoryAudit[];
  warehouses: WarehouseNode[];
};
