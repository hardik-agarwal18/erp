import type { PurchaseOrder, PurchaseStatus } from "@/types/app";

export type PurchaseOrderLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
};

export type GoodsReceivedNote = {
  id: string;
  reference: string;
  purchaseOrderNumber: string;
  vendor: string;
  warehouse: string;
  receivedDate: string;
  status: "draft" | "posted";
  receivedBy: string;
  itemsReceived: number;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  buyer: string;
  notes: string;
  lineItems: PurchaseOrderLineItem[];
  receipts: GoodsReceivedNote[];
  activity: string[];
};

export type PurchaseFiltersState = {
  search: string;
  status: PurchaseStatus | "all";
};

export type PurchaseLineItemFormValues = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type PurchaseFormValues = {
  vendor: string;
  number: string;
  orderDate: string;
  expectedDate: string;
  warehouse: string;
  approvalStage: string;
  paymentTerms: string;
  buyer: string;
  notes: string;
  lineItems: PurchaseLineItemFormValues[];
};

export type GoodsReceivedNoteFormValues = {
  purchaseOrderNumber: string;
  vendor: string;
  warehouse: string;
  receivedDate: string;
  receivedBy: string;
  itemsReceived: number;
};

export type PurchasesPayload = {
  summary: Array<{ label: string; value: string; detail: string }>;
  orders: PurchaseOrderDetail[];
  receipts: GoodsReceivedNote[];
};

export function calculatePurchaseAmount(lineItems: Array<{ quantity: number; unitPrice: number }>) {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
