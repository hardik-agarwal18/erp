export interface PurchaseRequisitionItemInput {
  productId: string;
  quantity: number;
  estimatedPrice?: number;
  notes?: string;
}

export interface CreatePurchaseRequisitionInput {
  departmentId?: string;
  requiredDate?: Date;
  notes?: string;
  items: PurchaseRequisitionItemInput[];
}

export interface UpdatePurchaseRequisitionInput {
  departmentId?: string;
  requiredDate?: Date;
  notes?: string;
  items?: PurchaseRequisitionItemInput[];
}
