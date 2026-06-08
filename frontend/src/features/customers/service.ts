import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Customer } from "@/types/app";

import type { CustomerFormSchema } from "./schema";
import type { CustomersPayload } from "./types";

type BackendCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
  creditLimit: number | null;
  createdAt: string;
};

type CustomerLedgerResponse = {
  customer: BackendCustomer;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string | null;
    status: string;
    totalAmount: number;
    paidAmount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    reference: string | null;
  }>;
  outstandingBalance: number;
  creditBalance: number;
};

const DEFAULT_WORKSPACE_ID = "live";

function formatCode(prefix: string, id: string) {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

function mapCustomerStatus(outstandingBalance: number) {
  if (outstandingBalance > 0) {
    return "at_risk" as const;
  }

  return "active" as const;
}

function mapLedgerToCustomer(ledger: CustomerLedgerResponse): Customer {
  const customer = ledger.customer;
  const lastInvoice = ledger.invoices[0];
  const totalRevenue = ledger.invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

  return {
    id: customer.id,
    code: formatCode("CUS", customer.id),
    name: customer.name,
    legalName: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    status: mapCustomerStatus(ledger.outstandingBalance),
    segment: customer.creditLimit && customer.creditLimit >= 100_000 ? "enterprise" : customer.creditLimit && customer.creditLimit >= 25_000 ? "mid_market" : "smb",
    gstin: customer.gstNumber ?? "",
    currency: "INR",
    paymentTerms: "Net 30",
    creditLimit: Number(customer.creditLimit ?? 0),
    outstandingBalance: ledger.outstandingBalance,
    totalRevenue,
    lastInvoiceDate: lastInvoice?.issueDate?.slice(0, 10) ?? customer.createdAt.slice(0, 10),
    owner: "Organization Team",
    billingAddress: customer.address ?? "",
    shippingAddress: customer.address ?? "",
    workspaceId: DEFAULT_WORKSPACE_ID,
    documents: [],
    timeline: [
      ...ledger.invoices.slice(0, 5).map((invoice) => ({
        id: `invoice-${invoice.id}`,
        title: `Invoice ${invoice.invoiceNumber}`,
        detail: `Status ${invoice.status.toLowerCase().replaceAll("_", " ")} with total ${invoice.totalAmount}.`,
        occurredAt: invoice.issueDate.slice(0, 10),
        kind: "invoice" as const,
      })),
      ...ledger.payments.slice(0, 5).map((payment) => ({
        id: `payment-${payment.id}`,
        title: `Payment ${payment.reference ?? payment.id.slice(0, 8)}`,
        detail: `Payment received for ${payment.amount}.`,
        occurredAt: payment.paymentDate.slice(0, 10),
        kind: "payment" as const,
      })),
    ].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    invoices: ledger.invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: customer.name,
      issueDate: invoice.issueDate.slice(0, 10),
      dueDate: invoice.dueDate?.slice(0, 10) ?? invoice.issueDate.slice(0, 10),
      status: invoice.status === "PAID" ? "paid" : invoice.status === "PARTIALLY_PAID" ? "partial" : invoice.status === "OVERDUE" ? "overdue" : invoice.status === "DRAFT" ? "draft" : "sent",
      amount: Number(invoice.totalAmount),
      balance: Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0),
      salesRep: "ERP",
      currency: "INR",
      workspaceId: DEFAULT_WORKSPACE_ID,
      activity: [],
    })),
    transactions: [
      ...ledger.invoices.map((invoice) => ({
        id: `invoice-txn-${invoice.id}`,
        date: invoice.issueDate.slice(0, 10),
        type: "invoice" as const,
        reference: invoice.invoiceNumber,
        amount: Number(invoice.totalAmount),
        balance: Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0),
      })),
      ...ledger.payments.map((payment) => ({
        id: `payment-txn-${payment.id}`,
        date: payment.paymentDate.slice(0, 10),
        type: "payment" as const,
        reference: payment.reference ?? payment.id.slice(0, 8),
        amount: Number(payment.amount),
        balance: 0,
      })),
    ].sort((left, right) => right.date.localeCompare(left.date)),
  };
}

export async function getCustomers() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendCustomer>>>(apiEndpoints.customers.list, {
    params: { page: 1, limit: 50 },
  });

  const ledgers = await Promise.all(
    response.data.data.items.map(async (customer) => {
      const ledgerResponse = await apiClient.get<ApiResponse<CustomerLedgerResponse>>(apiEndpoints.customers.ledger(customer.id));
      return ledgerResponse.data.data;
    }),
  );

  const customers = ledgers.map(mapLedgerToCustomer);

  const payload: CustomersPayload = {
    customers,
    summary: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((customer) => customer.status === "active").length,
      atRiskCustomers: customers.filter((customer) => customer.status === "at_risk").length,
      totalOutstanding: customers.reduce((sum, customer) => sum + customer.outstandingBalance, 0),
    },
  };

  return payload;
}

export async function getCustomerById(customerId: string) {
  const response = await apiClient.get<ApiResponse<CustomerLedgerResponse>>(apiEndpoints.customers.ledger(customerId));
  return mapLedgerToCustomer(response.data.data);
}

export async function createCustomer(input: CustomerFormSchema) {
  const response = await apiClient.post<ApiResponse<BackendCustomer>>(apiEndpoints.customers.list, {
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    gstNumber: input.gstin || undefined,
    address: input.billingAddress || undefined,
    creditLimit: input.creditLimit,
  });

  return getCustomerById(response.data.data.id);
}

export async function updateCustomer(customerId: string, input: CustomerFormSchema) {
  await apiClient.patch(apiEndpoints.customers.details(customerId), {
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    gstNumber: input.gstin || undefined,
    address: input.billingAddress || undefined,
    creditLimit: input.creditLimit,
  });

  return getCustomerById(customerId);
}
