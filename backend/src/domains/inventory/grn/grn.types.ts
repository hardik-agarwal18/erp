// @ts-nocheck
export type CreateGRNItemInput = {
  productId: string;
  orderedQty?: number;
  receivedQty: number;
  batchMode?: "SELECT_EXISTING" | "CREATE_NEW";
  batchId?: string;
  batchNumber?: string;
  manufactureDate?: Date | string;
  expiryDate?: Date | string;
  unitPrice: number;
  serialNumbers?: string[];
};

export type CreateGRNInput = {
  grnNumber: string;
  vendorId?: string;
  receivedDate: Date;
  godownId: string;
  notes?: string;
  items: CreateGRNItemInput[];
};

export type GRNFilters = {
  search?: string;
  status?: "DRAFT" | "COMPLETED" | "CANCELLED";
  godownId?: string;
  vendorId?: string;
};
