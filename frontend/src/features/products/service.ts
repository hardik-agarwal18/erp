import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Product } from "@/types/app";

import type { ProductFormSchema } from "./schema";
import type { ProductsPayload } from "./types";

type BackendProduct = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  unit: string | null;
  sellingPrice: number;
  purchasePrice: number | null;
  type: "PHYSICAL" | "SERVICE";
  category: { id: string; name: string } | null;
  tax: { id: string; name: string; rate: number } | null;
  createdAt: string;
  updatedAt: string;
};

type BackendInventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  reorderLevel: number | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
  updatedAt: string;
};

type BackendCategory = {
  id: string;
  name: string;
  description: string | null;
};

const DEFAULT_WORKSPACE_ID = "live";

function buildInventory(productId: string, items: BackendInventoryItem[]) {
  const inventoryItem = items.find((item) => item.productId === productId);
  const onHand = Number(inventoryItem?.quantity ?? 0);
  const reorderPoint = Number(inventoryItem?.reorderLevel ?? 0);

  return {
    onHand,
    reserved: 0,
    available: onHand,
    incoming: 0,
    reorderPoint,
    safetyStock: reorderPoint,
    status: onHand <= 0 ? ("critical" as const) : reorderPoint > 0 && onHand <= reorderPoint ? ("reorder" as const) : ("healthy" as const),
  };
}

function mapProduct(product: BackendProduct, categories: BackendCategory[], items: BackendInventoryItem[]): Product {
  const inventory = buildInventory(product.id, items);
  const costPrice = Number(product.purchasePrice ?? 0);
  const salePrice = Number(product.sellingPrice ?? 0);
  const marginPercent = costPrice > 0 ? Number((((salePrice - costPrice) / costPrice) * 100).toFixed(1)) : 0;

  return {
    id: product.id,
    code: `PRD-${product.id.slice(0, 8).toUpperCase()}`,
    sku: product.sku ?? "",
    name: product.name,
    description: product.description ?? "",
    status: "active",
    type: product.type === "SERVICE" ? "service" : "finished_good",
    category: product.category?.name ?? categories[0]?.name ?? "Uncategorized",
    unitOfMeasure: product.unit ?? "EA",
    barcode: "",
    taxCode: product.tax?.name ?? "",
    supplier: {
      vendorId: "",
      vendorName: "Not linked",
      leadTimeDays: 0,
      minimumOrderQuantity: 0,
      paymentTerms: "Net 30",
      lastPurchaseDate: product.updatedAt.slice(0, 10),
    },
    pricing: {
      costPrice,
      salePrice,
      wholesalePrice: salePrice,
      taxRate: Number(product.tax?.rate ?? 0),
      marginPercent,
      currency: "USD",
      lastUpdated: product.updatedAt.slice(0, 10),
    },
    inventory,
    warehouses: [
      {
        id: `wh-${product.id}`,
        warehouse: "Primary",
        bin: "N/A",
        onHand: inventory.onHand,
        reserved: inventory.reserved,
        incoming: inventory.incoming,
        updatedAt: product.updatedAt.slice(0, 10),
      },
    ],
    tags: [product.type.toLowerCase(), (product.category?.name ?? "uncategorized").toLowerCase().replace(/\s+/g, "-")],
    workspaceId: DEFAULT_WORKSPACE_ID,
    updatedAt: product.updatedAt.slice(0, 10),
  };
}

async function loadProductDependencies() {
  const [productsResponse, categoriesResponse, inventoryResponse] = await Promise.all([
    apiClient.get<ApiResponse<PaginatedResponse<BackendProduct>>>(apiEndpoints.products.list, {
      params: { page: 1, limit: 50 },
    }),
    apiClient.get<ApiResponse<PaginatedResponse<BackendCategory>>>(apiEndpoints.products.categories, {
      params: { page: 1, limit: 50 },
    }),
    apiClient.get<ApiResponse<PaginatedResponse<BackendInventoryItem>>>(apiEndpoints.inventory.items, {
      params: { page: 1, limit: 100 },
    }),
  ]);

  return {
    products: productsResponse.data.data.items,
    categories: categoriesResponse.data.data.items,
    inventoryItems: inventoryResponse.data.data.items,
  };
}

export async function getProducts() {
  const { products, categories, inventoryItems } = await loadProductDependencies();
  const mappedProducts = products.map((product) => mapProduct(product, categories, inventoryItems));

  const payload: ProductsPayload = {
    products: mappedProducts,
    summary: {
      totalProducts: mappedProducts.length,
      activeProducts: mappedProducts.filter((product) => product.status === "active").length,
      reorderProducts: mappedProducts.filter((product) => product.inventory.status !== "healthy").length,
      inventoryValue: mappedProducts.reduce((sum, product) => sum + product.inventory.onHand * product.pricing.costPrice, 0),
    },
  };

  return payload;
}

export async function getProductById(productId: string) {
  const { products, categories, inventoryItems } = await loadProductDependencies();
  const product = products.find((entry) => entry.id === productId);
  return product ? mapProduct(product, categories, inventoryItems) : null;
}

export async function createProduct(input: ProductFormSchema) {
  const categoriesResponse = await apiClient.get<ApiResponse<PaginatedResponse<BackendCategory>>>(apiEndpoints.products.categories, {
    params: { page: 1, limit: 50 },
  });

  const matchingCategory = categoriesResponse.data.data.items.find((category) => category.name.toLowerCase() === input.category.toLowerCase());

  const response = await apiClient.post<ApiResponse<BackendProduct>>(apiEndpoints.products.list, {
    name: input.name,
    sku: input.sku || undefined,
    description: input.description || undefined,
    unit: input.unitOfMeasure || undefined,
    sellingPrice: input.salePrice,
    purchasePrice: input.costPrice,
    categoryId: matchingCategory?.id,
    type: input.type === "service" ? "SERVICE" : "PHYSICAL",
  });

  return getProductById(response.data.data.id);
}

export async function updateProduct(productId: string, input: ProductFormSchema) {
  const categoriesResponse = await apiClient.get<ApiResponse<PaginatedResponse<BackendCategory>>>(apiEndpoints.products.categories, {
    params: { page: 1, limit: 50 },
  });

  const matchingCategory = categoriesResponse.data.data.items.find((category) => category.name.toLowerCase() === input.category.toLowerCase());

  await apiClient.patch(apiEndpoints.products.details(productId), {
    name: input.name,
    sku: input.sku || undefined,
    description: input.description || undefined,
    unit: input.unitOfMeasure || undefined,
    sellingPrice: input.salePrice,
    purchasePrice: input.costPrice,
    categoryId: matchingCategory?.id,
    type: input.type === "service" ? "SERVICE" : "PHYSICAL",
  });

  return getProductById(productId);
}
