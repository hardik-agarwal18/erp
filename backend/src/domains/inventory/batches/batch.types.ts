// @ts-nocheck
export type BatchFilters = {
  search?: string;
  godownId?: string;
  productId?: string;
  status?: "ACTIVE" | "EXPIRING" | "EXPIRED";
  expiryFrom?: Date;
  expiryTo?: Date;
};

export type ExpiringBatchFilters = {
  days?: number;
};

export type BatchTraceabilityResponse = {
  date: Date;
  eventType: string;
  referenceId: string;
  quantity: number;
  godown: string;
}[];
