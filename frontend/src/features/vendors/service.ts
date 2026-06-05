import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Vendor } from "@/types/app";

import type { VendorFormSchema } from "./schema";
import type { VendorsPayload } from "./types";

type BackendVendor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
  createdAt: string;
};

type VendorLedgerResponse = {
  vendor: BackendVendor;
  purchases: Array<{
    id: string;
    amount: number;
    category: string;
    expenseDate: string;
    notes: string | null;
  }>;
  payments: Array<never>;
  outstandingPayables: number;
  totalPurchases: number;
};

const DEFAULT_WORKSPACE_ID = "live";

function mapVendorStatus(totalPurchases: number) {
  return totalPurchases > 0 ? ("active" as const) : ("review" as const);
}

function mapVendorCategory(category?: string | null) {
  if (category?.toLowerCase().includes("service")) {
    return "services" as const;
  }

  if (category?.toLowerCase().includes("log")) {
    return "logistics" as const;
  }

  return "raw_materials" as const;
}

function mapLedgerToVendor(ledger: VendorLedgerResponse): Vendor {
  const vendor = ledger.vendor;
  const lastPurchase = ledger.purchases[0];

  return {
    id: vendor.id,
    code: `VEN-${vendor.id.slice(0, 8).toUpperCase()}`,
    name: vendor.name,
    legalName: vendor.name,
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    status: mapVendorStatus(ledger.totalPurchases),
    category: mapVendorCategory(lastPurchase?.category),
    gstin: vendor.gstNumber ?? "",
    currency: "USD",
    paymentTerms: "Net 30",
    leadTimeDays: 0,
    outstandingBalance: Number(ledger.outstandingPayables),
    totalSpend: Number(ledger.totalPurchases),
    lastBillDate: lastPurchase?.expenseDate?.slice(0, 10) ?? vendor.createdAt.slice(0, 10),
    accountManager: "Procurement Team",
    billingAddress: vendor.address ?? "",
    shippingAddress: vendor.address ?? "",
    workspaceId: DEFAULT_WORKSPACE_ID,
    documents: [],
    timeline: ledger.purchases.slice(0, 5).map((purchase) => ({
      id: `purchase-${purchase.id}`,
      title: purchase.category,
      detail: purchase.notes ?? "Expense posted against this vendor.",
      occurredAt: purchase.expenseDate.slice(0, 10),
      kind: "purchase" as const,
    })),
    purchaseOrders: ledger.purchases.map((purchase) => ({
      id: purchase.id,
      vendor: vendor.name,
      number: `EXP-${purchase.id.slice(0, 8).toUpperCase()}`,
      expectedDate: purchase.expenseDate.slice(0, 10),
      warehouse: "N/A",
      status: "billed" as const,
      amount: Number(purchase.amount),
      approvalStage: "Posted",
      workspaceId: DEFAULT_WORKSPACE_ID,
      paymentTerms: "Net 30",
      outstandingBalance: 0,
      notes: purchase.notes ?? "",
    })),
    transactions: ledger.purchases.map((purchase) => ({
      id: `vendor-txn-${purchase.id}`,
      date: purchase.expenseDate.slice(0, 10),
      type: "bill" as const,
      reference: `EXP-${purchase.id.slice(0, 8).toUpperCase()}`,
      amount: Number(purchase.amount),
      balance: 0,
    })),
  };
}

export async function getVendors() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendVendor>>>(apiEndpoints.vendors.list, {
    params: { page: 1, limit: 50 },
  });

  const ledgers = await Promise.all(
    response.data.data.items.map(async (vendor) => {
      const ledgerResponse = await apiClient.get<ApiResponse<VendorLedgerResponse>>(apiEndpoints.vendors.ledger(vendor.id));
      return ledgerResponse.data.data;
    }),
  );

  const vendors = ledgers.map(mapLedgerToVendor);

  const payload: VendorsPayload = {
    vendors,
    summary: {
      totalVendors: vendors.length,
      activeVendors: vendors.filter((vendor) => vendor.status === "active").length,
      reviewVendors: vendors.filter((vendor) => vendor.status === "review").length,
      totalOutstanding: vendors.reduce((sum, vendor) => sum + vendor.outstandingBalance, 0),
    },
  };

  return payload;
}

export async function getVendorById(vendorId: string) {
  const response = await apiClient.get<ApiResponse<VendorLedgerResponse>>(apiEndpoints.vendors.ledger(vendorId));
  return mapLedgerToVendor(response.data.data);
}

export async function createVendor(input: VendorFormSchema) {
  const response = await apiClient.post<ApiResponse<BackendVendor>>(apiEndpoints.vendors.list, {
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    gstNumber: input.gstin || undefined,
    address: input.billingAddress || undefined,
  });

  return getVendorById(response.data.data.id);
}

export async function updateVendor(vendorId: string, input: VendorFormSchema) {
  await apiClient.patch(apiEndpoints.vendors.details(vendorId), {
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    gstNumber: input.gstin || undefined,
    address: input.billingAddress || undefined,
  });

  return getVendorById(vendorId);
}
