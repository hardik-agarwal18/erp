export type DebitNoteItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type CreateDebitNoteInput = {
  customerId: string;
  issueDate: string;
  status?: "DRAFT" | "POSTED";
  notes?: string;
  items: DebitNoteItemInput[];
};
