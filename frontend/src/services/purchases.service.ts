import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type VendorInvoice = {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  poNumber: string | null;
  date: string;
  dueDate: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PAID" | "VOID" | "POSTED" | "RECEIVED" | "OVERDUE" | "DISPUTED";
  createdAt: string;
  updatedAt: string;
};

export type MatchSummary = {
  poFound: boolean;
  poNumber: string | null;
  poTotal: number;
  grnFound: boolean;
  grnNumbers: string[];
  grnTotalReceived: number;
  invoiceTotal: number;
  matchStatus: "MATCHED" | "DISCREPANCY" | "MISSING_DOCUMENTS";
  discrepancies: string[];
};

export const purchasesService = {
  listInvoices: async () => {
    const res = await apiClient.get<{ data: VendorInvoice[] }>(apiEndpoints.purchases.invoices);
    return res.data;
  },

  getInvoiceDetails: async (id: string) => {
    const res = await apiClient.get<{ data: VendorInvoice }>(apiEndpoints.purchases.invoiceDetails(id));
    return res.data;
  },

  getMatchSummary: async (id: string) => {
    const res = await apiClient.post<{ data: MatchSummary }>(apiEndpoints.purchases.matchSummary(id), {});
    return res.data;
  },

  createInvoice: async (data: any) => {
    const res = await apiClient.post<{ data: VendorInvoice }>(apiEndpoints.purchases.createInvoice, data);
    return res.data;
  },

  postInvoice: async (id: string) => {
    const res = await apiClient.post<{ data: VendorInvoice }>(apiEndpoints.purchases.postInvoice(id), {});
    return res.data;
  }
};
