// @ts-nocheck
export interface CreatePurchaseOrderInput {
  vendorId: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  currencyCode?: string;
  exchangeRate?: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    discountAmount?: number;
  }>;
}
