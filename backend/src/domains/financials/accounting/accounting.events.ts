export interface SalesInvoiceIssuedPayload {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issuedAt: string;
  cogsAmount?: number; // Optional for non-inventory invoices
}

export interface CustomerPaymentReceivedPayload {
  paymentId: string;
  paymentReference: string;
  customerId: string;
  amount: number;
  currency: string;
  bankAccountId?: string;
  receivedAt: string;
}

export interface VendorInvoiceApprovedPayload {
  invoiceId: string;
  invoiceNumber: string;
  vendorId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  approvedAt: string;
}

export interface VendorPaymentCompletedPayload {
  paymentId: string;
  paymentReference: string;
  vendorId: string;
  amount: number;
  currency: string;
  bankAccountId?: string;
  paidAt: string;
}

export interface GoodsReceiptNoteReceivedPayload {
  grnId: string;
  grnNumber: string;
  vendorId?: string;
  purchaseOrderId?: string;
  totalValue: number;
  currency: string;
  receivedAt: string;
}
