import type { Vendor, VendorCategory, VendorStatus } from "@/types/app";

export type VendorFiltersState = {
  search: string;
  status: VendorStatus | "all";
  category: VendorCategory | "all";
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
