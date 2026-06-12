
export type StockAdjustmentInput = {
  productId: string;
  godownId: string;
  quantity: number;
  referenceId?: string;
};

export type StockTransferInput = {
  productId: string;
  fromGodownId: string;
  toGodownId: string;
  quantity: number;
  referenceId?: string;
};

export type InventoryFilters = {
  search?: string;
  productId?: string;
  godownId?: string;
};
