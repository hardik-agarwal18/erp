import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";

import type { InventoryAuditSchema, StockAdjustmentSchema, StockTransferSchema, WarehouseSchema } from "./schema";

type BackendInventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  reorderLevel: number | null;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    category?: { name: string } | null;
    sellingPrice?: number;
  };
};

type BackendInventoryMovement = {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  referenceId: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
};

export async function getInventoryManagement() {
  const [itemsResponse, movementsResponse] = await Promise.all([
    apiClient.get<ApiResponse<PaginatedResponse<BackendInventoryItem>>>(apiEndpoints.inventory.items, {
      params: { page: 1, limit: 100 },
    }),
    apiClient.get<ApiResponse<PaginatedResponse<BackendInventoryMovement>>>(apiEndpoints.inventory.movements, {
      params: { page: 1, limit: 100 },
    }),
  ]);

  const items = itemsResponse.data.data.items.map((item) => ({
    id: item.id,
    name: item.product.name,
    sku: item.product.sku ?? "",
    category: item.product.category?.name ?? "Uncategorized",
    warehouse: "Primary",
    onHand: Number(item.quantity),
    reserved: 0,
    reorderPoint: Number(item.reorderLevel ?? 0),
    valuation: Number(item.quantity) * Number(item.product.sellingPrice ?? 0),
    status: Number(item.quantity) <= 0 ? ("out_of_stock" as const) : item.reorderLevel && Number(item.quantity) <= item.reorderLevel ? ("low_stock" as const) : ("in_stock" as const),
    workspaceId: "live",
  }));

  const movements = movementsResponse.data.data.items.map((movement) => ({
    id: movement.id,
    itemName: movement.product.name,
    sku: movement.product.sku ?? "",
    warehouse: "Primary",
    quantity: Number(movement.quantity),
    direction: movement.quantity >= 0 ? ("increase" as const) : ("decrease" as const),
    reason: movement.type.toLowerCase(),
    requestedBy: "System",
    approvedBy: "System",
    status: "posted" as const,
    postedAt: movement.createdAt.slice(0, 10),
    note: movement.referenceId ?? "",
  }));

  return {
    summary: [
      { label: "Tracked Items", value: String(items.length), detail: "Inventory items returned by the backend item listing.", tone: "neutral" as const },
      { label: "Low Stock", value: String(items.filter((item) => item.status === "low_stock").length), detail: "Items at or below reorder thresholds.", tone: "warning" as const },
      { label: "Out of Stock", value: String(items.filter((item) => item.status === "out_of_stock").length), detail: "Items with no available on-hand stock.", tone: "danger" as const },
      { label: "Inventory Value", value: String(items.reduce((sum, item) => sum + item.valuation, 0)), detail: "Live valuation using backend product selling prices.", tone: "success" as const },
    ],
    items,
    alerts: items
      .filter((item) => item.status !== "in_stock")
      .map((item) => ({
        id: item.id,
        title: `${item.name} needs attention`,
        detail: `${item.sku} is currently marked ${item.status.replaceAll("_", " ")} in the backend inventory feed.`,
        severity: item.status === "out_of_stock" ? ("critical" as const) : ("warning" as const),
      })),
    adjustments: movements.filter((movement) => movement.reason === "adjustment"),
    transfers: movements.filter((movement) => movement.reason === "transfer").map((movement) => ({
      id: movement.id,
      reference: movement.note || movement.id.slice(0, 8),
      itemName: movement.itemName,
      sku: movement.sku,
      fromWarehouse: "Primary",
      toWarehouse: "Transfer target",
      quantity: Math.abs(movement.quantity),
      status: "received" as const,
      eta: movement.postedAt,
      requestedBy: movement.requestedBy,
    })),
    audits: [] as any[],
    warehouses: [] as any[],
  };
}

export async function createStockAdjustment(input: StockAdjustmentSchema) {
  const itemsResponse = await apiClient.get<ApiResponse<PaginatedResponse<BackendInventoryItem>>>(apiEndpoints.inventory.items, {
    params: { page: 1, limit: 100, search: input.sku },
  });
  const item = itemsResponse.data.data.items.find((entry) => entry.product.sku === input.sku);

  if (!item) {
    throw new Error("Product not found for stock adjustment");
  }

  const quantity = input.direction === "increase" ? input.quantity : input.quantity * -1;
  const response = await apiClient.post<ApiResponse<{ movement: BackendInventoryMovement }>>(apiEndpoints.inventory.adjustments, {
    productId: item.productId,
    quantity,
    referenceId: input.note || undefined,
  });

  return {
    id: response.data.data.movement.id,
    itemName: item.product.name,
    sku: input.sku,
    warehouse: input.warehouse,
    quantity,
    direction: input.direction,
    reason: input.reason,
    requestedBy: input.requestedBy,
    approvedBy: "System",
    status: "posted" as const,
    postedAt: response.data.data.movement.createdAt.slice(0, 10),
    note: input.note,
  };
}

export async function createStockTransfer(input: StockTransferSchema) {
  const itemsResponse = await apiClient.get<ApiResponse<PaginatedResponse<BackendInventoryItem>>>(apiEndpoints.inventory.items, {
    params: { page: 1, limit: 100, search: input.sku },
  });
  const item = itemsResponse.data.data.items.find((entry) => entry.product.sku === input.sku);

  if (!item) {
    throw new Error("Product not found for stock transfer");
  }

  const response = await apiClient.post<ApiResponse<{ movement: BackendInventoryMovement }>>(apiEndpoints.inventory.transfers, {
    productId: item.productId,
    quantity: input.quantity,
  });

  return {
    id: response.data.data.movement.id,
    reference: response.data.data.movement.id.slice(0, 8),
    itemName: item.product.name,
    sku: input.sku,
    fromWarehouse: input.fromWarehouse,
    toWarehouse: input.toWarehouse,
    quantity: input.quantity,
    status: "received" as const,
    eta: input.eta,
    requestedBy: input.requestedBy,
  };
}

export async function scheduleInventoryAudit(_input: InventoryAuditSchema) {
  throw new Error("Inventory audit scheduling is not implemented by the backend API");
}

export async function saveWarehouseSettings(_input: WarehouseSchema) {
  throw new Error("Warehouse management is not implemented by the backend API");
}

export type StockGroup = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
};

export async function getStockGroups() {
  const response = await apiClient.get<ApiResponse<StockGroup[]>>(apiEndpoints.inventory.stockGroups.list);
  return response.data.data;
}

export async function createStockGroup(data: any) {
  const response = await apiClient.post<ApiResponse<StockGroup>>(apiEndpoints.inventory.stockGroups.create, data);
  return response.data.data;
}

export async function updateStockGroup(id: string, data: any) {
  const response = await apiClient.patch<ApiResponse<StockGroup>>(apiEndpoints.inventory.stockGroups.update(id), data);
  return response.data.data;
}

export async function deleteStockGroup(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(apiEndpoints.inventory.stockGroups.delete(id));
  return response.data.data;
}
