export type CreateQuotationInput = {
  customerId: string;
  issueDate: string;
  validUntil: string;
  expiresAutomatically?: boolean;
  notes?: string;
  lines: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
};

export type UpdateQuotationInput = Partial<
  Omit<CreateQuotationInput, "customerId">
>;

export type CreateQuotationRevisionInput = {
  issueDate?: string;
  validUntil?: string;
  expiresAutomatically?: boolean;
  notes?: string;
  lines?: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
};
