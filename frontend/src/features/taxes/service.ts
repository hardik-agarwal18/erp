import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Tax } from "@/types/app";

import type { TaxFormSchema } from "./schema";

export async function getTaxes() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Tax>>>(apiEndpoints.taxes.list, {
    params: { page: 1, limit: 100 },
  });

  return {
    taxes: response.data.data.items,
  };
}

export async function getTaxById(taxId: string) {
  const response = await apiClient.get<ApiResponse<Tax>>(apiEndpoints.taxes.details(taxId));
  return response.data.data;
}

export async function createTax(input: TaxFormSchema) {
  const response = await apiClient.post<ApiResponse<Tax>>(apiEndpoints.taxes.list, input);
  return response.data.data;
}

export async function updateTax(taxId: string, input: Partial<TaxFormSchema>) {
  const response = await apiClient.patch<ApiResponse<Tax>>(apiEndpoints.taxes.details(taxId), input);
  return response.data.data;
}

export async function archiveTax(taxId: string) {
  await apiClient.delete(apiEndpoints.taxes.details(taxId));
}
