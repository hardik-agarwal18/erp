
export type CreateStockGroupInput = {
  name: string;
  description?: string;
  parentId?: string;
};

export type UpdateStockGroupInput = Partial<CreateStockGroupInput>;

export type StockGroupFilters = {
  search?: string;
  parentId?: string;
};
