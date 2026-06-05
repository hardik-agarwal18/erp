import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { OrganizationMembership } from "@/types/app";

export async function listOrganizations() {
  const response = await apiClient.get<ApiResponse<OrganizationMembership[]>>(apiEndpoints.organizations.list);
  return response.data.data;
}

export async function createOrganization(payload: { name: string; slug?: string }) {
  const response = await apiClient.post<ApiResponse<OrganizationMembership>>(apiEndpoints.organizations.list, payload);
  return response.data.data;
}
