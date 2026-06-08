import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { OrganizationMembership } from "@/types/app";

export async function listOrganizations() {
  const response = await apiClient.get<ApiResponse<OrganizationMembership[]>>(apiEndpoints.organizations.list);
  return response.data.data;
}

export async function createOrganization(payload: { name: string; slug?: string; invites?: string[] }) {
  const response = await apiClient.post<ApiResponse<OrganizationMembership>>(apiEndpoints.organizations.list, payload);
  return response.data.data;
}

export type JoinRequest = {
  id: string;
  organizationId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export async function createJoinRequest(payload: { joinCode: string; message?: string }) {
  const response = await apiClient.post<ApiResponse<JoinRequest>>(apiEndpoints.organizations.join, payload);
  return response.data.data;
}

export async function listJoinRequests(organizationId: string) {
  const response = await apiClient.get<ApiResponse<JoinRequest[]>>(apiEndpoints.organizations.joinRequests(organizationId));
  return response.data.data;
}

export async function approveJoinRequest({ organizationId, requestId }: { organizationId: string; requestId: string }) {
  const response = await apiClient.post<ApiResponse<JoinRequest>>(apiEndpoints.organizations.approveJoinRequest(organizationId, requestId));
  return response.data.data;
}

export async function rejectJoinRequest({ organizationId, requestId }: { organizationId: string; requestId: string }) {
  const response = await apiClient.post<ApiResponse<JoinRequest>>(apiEndpoints.organizations.rejectJoinRequest(organizationId, requestId));
  return response.data.data;
}
