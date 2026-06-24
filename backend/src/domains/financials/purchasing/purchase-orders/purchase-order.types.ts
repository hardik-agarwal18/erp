export interface CreatePurchaseOrderInput {
  vendorId: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  currencyCode?: string;
  exchangeRate?: number;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    discountAmount?: number;
  }[];
}

export interface RevisePurchaseOrderInput {
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    discountAmount?: number;
  }[];
}
