// @ts-nocheck
export type CreateTaxInput = {
  name: string;
  rate: number;
  type: "GST" | "VAT" | "SALES_TAX" | "OTHER";
  isDefault?: boolean;
};

export type UpdateTaxInput = {
  name?: string;
  rate?: number;
  type?: "GST" | "VAT" | "SALES_TAX" | "OTHER";
  isDefault?: boolean;
};
