
export type InvoiceItemInput = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
};

export type CreateInvoiceInput = {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  status?: "DRAFT" | "ISSUED";
  notes?: string;
  items: InvoiceItemInput[];
};

export type UpdateInvoiceInput = {
  customerId?: string;
  issueDate?: string;
  status?: "DRAFT" | "ISSUED" | "CANCELLED";
  dueDate?: string;
  notes?: string;
  items?: InvoiceItemInput[];
};
