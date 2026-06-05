"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { createProduct, getProductById, getProducts, updateProduct } from "../service";

export function useProductsQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.products(workspace.id),
    queryFn: getProducts,
  });
}

export function useProductDetailQuery(productId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.productDetail(workspace.id, productId),
    queryFn: () => getProductById(productId),
  });
}

export function useCreateProductMutation() {
  return useMutation({
    mutationFn: createProduct,
  });
}

export function useUpdateProductMutation(productId: string) {
  return useMutation({
    mutationFn: (values: Parameters<typeof updateProduct>[1]) => updateProduct(productId, values),
  });
}
