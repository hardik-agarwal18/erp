import type { Customer, CustomerSegment, CustomerStatus } from "@/types/app";

export type CustomerFiltersState = {
  search: string;
  status: CustomerStatus | "all";
  segment: CustomerSegment | "all";
};

export type CustomerFormValues = {
  code: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  segment: CustomerSegment;
  gstin: string;
  currency: string;
  paymentTerms: string;
  creditLimit: number;
  owner: string;
  billingAddress: string;
  shippingAddress: string;
};

export type CustomerSummary = {
  totalCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  totalOutstanding: number;
};

export type CustomersPayload = {
  summary: CustomerSummary;
  customers: Customer[];
};
