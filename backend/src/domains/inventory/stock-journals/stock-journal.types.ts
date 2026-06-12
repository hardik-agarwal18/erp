
export type CreateStockJournalItemInput = {
  productId: string;
  batchId?: string;
  quantity: number;
};

export type CreateStockJournalInput = {
  journalNumber: string;
  fromGodownId: string;
  toGodownId: string;
  notes?: string;
  items: CreateStockJournalItemInput[];
};

export type StockJournalFilters = {
  search?: string;
  status?: "DRAFT" | "COMPLETED" | "CANCELLED";
  godownId?: string;
};
