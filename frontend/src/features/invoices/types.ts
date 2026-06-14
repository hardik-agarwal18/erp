import type { Invoice, InvoiceLineItem, InvoiceStatus } from "@/types/app";

export type InvoiceFiltersState = {
  search: string;
  status: InvoiceStatus | "all";
};

export type InvoiceLineItemFormValues = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type InvoiceFormValues = {
  customer: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  salesRep: string;
  paymentTerms: number;
  notes: string;
  billingAddress: string;
  lineItems: InvoiceLineItemFormValues[];
};

export type InvoiceSummary = {
  totalInvoices: number;
  overdueCount: number;
  paidThisMonth: number;
  draftCount: number;
  outstandingBalance: number;
};

export type InvoicesPayload = {
  summary: InvoiceSummary;
  invoices: Invoice[];
};

export function calculateInvoiceAmount(lineItems: InvoiceLineItem[] | InvoiceLineItemFormValues[]) {
  return lineItems.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineTax = lineSubtotal * (item.taxRate / 100);
    return sum + lineSubtotal + lineTax;
  }, 0);
}
