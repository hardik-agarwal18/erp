// @ts-nocheck
export type CreateStockVerificationItemInput = {
  productId: string;
  batchId?: string;
  expectedQty: number;
};

export type CreateStockVerificationInput = {
  verificationNumber: string;
  godownId: string;
  scheduledDate: Date;
  notes?: string;
  items: CreateStockVerificationItemInput[];
};

export type CompleteStockVerificationItemInput = {
  id: string;
  physicalQty: number;
  missingSerialIds?: string[];
  foundSerialNumbers?: string[];
};

export type CompleteStockVerificationInput = {
  items: CompleteStockVerificationItemInput[];
};

export type StockVerificationFilters = {
  search?: string;
  status?: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  godownId?: string;
};
