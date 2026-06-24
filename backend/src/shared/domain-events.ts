/**
 * Single source of truth for all domain events across the ERP.
 * Prevents producer/consumer string literal drift.
 */
export const DomainEvents = {
  // Sales & Revenue
  SALES_INVOICE_POSTED: "SalesInvoicePOSTED",
  CUSTOMER_PAYMENT_RECEIVED: "CustomerPaymentReceived",
  
  // Procurement & Payables
  VENDOR_INVOICE_POSTED: "VendorInvoicePosted",
  VENDOR_PAYMENT_CREATED: "VendorPaymentCreated",
  
  // Inventory
  GRN_RECEIVED: "GoodsReceiptNoteReceived",
  STOCK_ADJUSTMENT_POSTED: "StockAdjustmentPosted",
  
  // HRMS & Payroll
  PAYROLL_APPROVED: "PayrollApproved",
  
  // IAM
  USER_REGISTERED: "UserRegistered",
  USER_LOGIN: "UserLogin",
} as const;

export type DomainEventType = typeof DomainEvents[keyof typeof DomainEvents];
