export interface CreateRfqInput {
  requisitionId?: string;
  issueDate?: Date;
  submissionDeadline?: Date;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    requiredDate?: Date;
    notes?: string;
  }[];
  vendorIds: string[]; // Vendors to invite
}

export interface VendorResponseItemInput {
  rfqItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface SubmitVendorResponseInput {
  vendorId: string;
  totalAmount: number;
  taxAmount?: number;
  leadTimeDays?: number;
  validUntil?: Date;
  notes?: string;
  items: VendorResponseItemInput[];
}

export interface AwardRfqInput {
  responseId: string;
  awardedReason?: string;
  notes?: string;
}
