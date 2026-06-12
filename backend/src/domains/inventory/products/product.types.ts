
export type CreateProductInput = {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice?: number;
  taxId?: string;
  categoryId?: string;
  type: "PHYSICAL" | "SERVICE";
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type CreateCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateCategoryInput = {
  name?: string;
  description?: string;
};

export type ProductFilters = {
  search?: string;
  type?: "PHYSICAL" | "SERVICE";
  categoryId?: string;
};
