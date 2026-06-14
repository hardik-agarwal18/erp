import type { Product, ProductStatus, ProductType } from "@/types/app";

export type ProductFiltersState = {
  search: string;
  status: ProductStatus | "all";
  type: ProductType | "all";
};

export type ProductFormValues = {
  code: string;
  sku: string;
  name: string;
  description: string;
  status: ProductStatus;
  type: ProductType;
  category: string;
  unitOfMeasure: string;
  barcode: string;
  taxCode: string;
  supplierName: string;
  supplierCode: string;
  supplierLeadTimeDays: number;
  supplierMinimumOrderQuantity: number;
  supplierpaymentTerms: number;
  costPrice: number;
  salePrice: number;
  wholesalePrice: number;
  taxRate: number;
  openingOnHand: number;
  reservedStock: number;
  incomingStock: number;
  reorderPoint: number;
  safetyStock: number;
  primaryWarehouse: string;
  primaryBin: string;
};

export type ProductSummary = {
  totalProducts: number;
  activeProducts: number;
  reorderProducts: number;
  inventoryValue: number;
};

export type ProductsPayload = {
  summary: ProductSummary;
  products: Product[];
};
