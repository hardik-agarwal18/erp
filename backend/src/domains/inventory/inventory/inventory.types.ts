// @ts-nocheck
export type StockAdjustmentInput = {
  productId: string;
  quantity: number;
  referenceId?: string;
};

export type StockTransferInput = {
  productId: string;
  quantity: number;
  referenceId?: string;
};

export type InventoryFilters = {
  search?: string;
  productId?: string;
};
