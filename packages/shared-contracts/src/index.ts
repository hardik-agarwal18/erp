/**
 * Single source of truth for all domain events across the ERP.
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

/**
 * Standardized audit actions across the entire platform.
 */
export const AuditActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  UPSERT: "UPSERT"
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
