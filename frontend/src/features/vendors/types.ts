import type { Vendor, VendorCategory, VendorStatus } from "@/types/app";

export type VendorFiltersState = {
  search: string;
  status: VendorStatus | "all";
  category: VendorCategory | "all";
};

export type VendorFormValues = {
  code: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  status: VendorStatus;
  category: VendorCategory;
  gstin: string;
  currency: string;
  paymentTerms: string;
  leadTimeDays: number;
  accountManager: string;
  billingAddress: string;
  shippingAddress: string;
};

export type VendorSummary = {
  totalVendors: number;
  activeVendors: number;
  reviewVendors: number;
  totalOutstanding: number;
};

export type VendorsPayload = {
  summary: VendorSummary;
  vendors: Vendor[];
};
