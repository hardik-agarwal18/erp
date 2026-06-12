// @ts-nocheck
export interface CreateVendorInvoiceInput {
  vendorId: string;
  purchaseOrderId?: string;
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string;
  notes?: string;
  items: Array<{
    productId: string;
    poItemId?: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    discountAmount?: number;
  }>;
}
