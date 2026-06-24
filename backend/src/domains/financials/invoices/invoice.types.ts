
export type InvoiceItemInput = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
};

export type CreateInvoiceInput = {
  customerId: string;
  sourceType?: "SALES_ORDER" | "DELIVERY_CHALLAN";
  salesOrderId?: string;
  deliveryChallanId?: string;
  issueDate: string;
  dueDate?: string;
  status?: "DRAFT" | "POSTED";
  notes?: string;
  items: InvoiceItemInput[];
};

export type UpdateInvoiceInput = {
  customerId?: string;
  issueDate?: string;
  status?: "DRAFT" | "POSTED" | "VOID";
  dueDate?: string;
  notes?: string;
  items?: InvoiceItemInput[];
};
