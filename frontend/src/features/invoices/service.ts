import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Invoice } from "@/types/app";

import type { InvoiceFormSchema } from "./schema";
import type { InvoicesPayload } from "./types";

type BackendInvoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  customer?: {
    id: string;
    name: string;
    email: string | null;
    address: string | null;
  };
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      sellingPrice: number;
      tax?: { rate: number } | null;
    };
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    reference: string | null;
  }>;
};

function mapInvoiceStatus(status: BackendInvoice["status"]) {
  switch (status) {
    case "DRAFT":
      return "draft" as const;
    case "PAID":
      return "paid" as const;
    case "PARTIALLY_PAID":
      return "partial" as const;
    case "OVERDUE":
      return "overdue" as const;
    default:
      return "sent" as const;
  }
}

function mapInvoice(invoice: BackendInvoice): Invoice {
  const paidAmount = invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    customer: invoice.customer?.name ?? invoice.customerId,
    issueDate: invoice.issueDate.slice(0, 10),
    dueDate: invoice.dueDate?.slice(0, 10) ?? invoice.issueDate.slice(0, 10),
    status: mapInvoiceStatus(invoice.status),
    amount: Number(invoice.totalAmount),
    balance: Math.max(Number(invoice.totalAmount || 0) - paidAmount, 0),
    salesRep: "ERP",
    currency: "INR",
    paymentTerms: "Net 30",
    notes: invoice.notes ?? "",
    billingAddress: invoice.customer?.address ?? "",
    lineItems: invoice.items?.map((item) => ({
      id: item.id,
      productId: item.product.id,
      description: item.product.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.product.tax?.rate ?? 0),
    })),
    workspaceId: "live",
    activity: [
      `Status: ${invoice.status.toLowerCase().replaceAll("_", " ")}`,
      ...(invoice.payments?.map((payment) => `Payment ${payment.reference ?? payment.id.slice(0, 8)} recorded on ${payment.paymentDate.slice(0, 10)}`) ?? []),
    ],
  };
}

export async function getInvoices() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendInvoice>>>(apiEndpoints.invoices.list, {
    params: { page: 1, limit: 100 },
  });

  const invoices = response.data.data.items.map(mapInvoice);

  const payload: InvoicesPayload = {
    invoices,
    summary: {
      totalInvoices: invoices.length,
      overdueCount: invoices.filter((invoice) => invoice.status === "overdue").length,
      paidThisMonth: invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0),
      draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
      outstandingBalance: invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
    },
  };

  return payload;
}

export async function getInvoiceById(invoiceId: string) {
  const response = await apiClient.get<ApiResponse<BackendInvoice>>(apiEndpoints.invoices.details(invoiceId));
  return mapInvoice(response.data.data);
}

export async function createInvoice(_input: InvoiceFormSchema) {
  throw new Error("Invoice creation now uses the live invoice form and no longer supports the legacy mock editor payload.");
}

export async function updateInvoice(_invoiceId: string, _input: InvoiceFormSchema) {
  throw new Error("Invoice editing now uses the live invoice form and no longer supports the legacy mock editor payload.");
}

export async function createLiveInvoice(payload: {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  status?: "DRAFT" | "ISSUED";
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
  }>;
}) {
  const response = await apiClient.post<ApiResponse<BackendInvoice>>(apiEndpoints.invoices.list, payload);
  return mapInvoice(response.data.data);
}

export async function updateLiveInvoice(
  invoiceId: string,
  payload: {
    customerId?: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    items?: Array<{
      productId: string;
      quantity: number;
      unitPrice?: number;
      discountAmount?: number;
    }>;
  },
) {
  const response = await apiClient.patch<ApiResponse<BackendInvoice>>(apiEndpoints.invoices.details(invoiceId), payload);
  return mapInvoice(response.data.data);
}

export async function downloadInvoicePdf(invoiceId: string) {
  const response = await apiClient.get(apiEndpoints.invoices.pdf(invoiceId), {
    responseType: "blob",
  });
  
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function sendInvoiceEmail(invoiceId: string, email: string) {
  const response = await apiClient.post<ApiResponse<void>>(apiEndpoints.invoices.send(invoiceId), { email });
  return response.data;
}

export async function getInvoiceEmailHistory(invoiceId: string) {
  const response = await apiClient.get<ApiResponse<any[]>>(apiEndpoints.invoices.emailHistory(invoiceId));
  return response.data.data;
}
