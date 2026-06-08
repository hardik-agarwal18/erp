import type { Customer, CustomerSegment, CustomerStatus } from "@/types/app";

export type CustomerFiltersState = {
  search: string;
  status: CustomerStatus | "all";
  segment: CustomerSegment | "all";
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
