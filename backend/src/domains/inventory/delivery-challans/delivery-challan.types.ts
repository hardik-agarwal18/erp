// @ts-nocheck
export type CreateDeliveryChallanItemInput = {
  productId: string;
  batchId?: string;
  quantity: number;
};

export type CreateDeliveryChallanInput = {
  challanNumber: string;
  customerId?: string;
  deliveryDate: Date;
  godownId: string;
  notes?: string;
  items: CreateDeliveryChallanItemInput[];
};

export type DeliveryChallanFilters = {
  search?: string;
  status?: "DRAFT" | "COMPLETED" | "CANCELLED";
  godownId?: string;
  customerId?: string;
};
