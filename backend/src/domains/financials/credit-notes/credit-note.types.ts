export type CreditNoteItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type CreateCreditNoteInput = {
  customerId: string;
  issueDate: string;
  status?: "DRAFT" | "POSTED";
  notes?: string;
  items: CreditNoteItemInput[];
};

export type ApplyCreditNoteInput = {
  applications: Array<{
    invoiceId: string;
    appliedAmount: number;
  }>;
};
