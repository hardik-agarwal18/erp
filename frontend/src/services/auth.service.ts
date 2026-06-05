import { apiClient, setStoredAccessToken } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { OrganizationMembership, Permission, SessionUser } from "@/types/app";

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

type ResetPasswordPayload = {
  token: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  user: SessionUser;
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;
};

type MeResponse = SessionUser & {
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;
};

type RefreshResponse = {
  accessToken: string;
};

type SwitchWorkspaceResponse = {
  accessToken: string;
  activeOrganization: OrganizationMembership | null;
  organizations: OrganizationMembership[];
};

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(apiEndpoints.auth.login, payload);
  setStoredAccessToken(response.data.data.accessToken);
  return response.data.data;
}

export async function signup(payload: SignupPayload) {
  const response = await apiClient.post<ApiResponse<null>>(apiEndpoints.auth.signup, payload);
  return response.data;
}

export async function logout() {
  await apiClient.post(apiEndpoints.auth.logout);
  setStoredAccessToken(null);
}

export async function logoutAll() {
  await apiClient.post(apiEndpoints.auth.logoutAll);
  setStoredAccessToken(null);
}

export async function refreshToken() {
  const response = await apiClient.post<ApiResponse<RefreshResponse>>(apiEndpoints.auth.refresh);
  const accessToken = response.data.data.accessToken;
  setStoredAccessToken(accessToken);
  return accessToken;
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiResponse<MeResponse>>(apiEndpoints.auth.me);
  return response.data.data;
}

export async function forgotPassword(email: string) {
  const response = await apiClient.post(apiEndpoints.auth.forgotPassword, { email });
  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await apiClient.post(apiEndpoints.auth.resetPassword, payload);
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await apiClient.get(apiEndpoints.auth.verifyEmail, {
    params: { token },
  });
  return response.data;
}

export async function resendVerification(email: string) {
  const response = await apiClient.post(apiEndpoints.auth.resendVerification, { email });
  return response.data;
}

export async function switchWorkspace(organizationId: string) {
  const response = await apiClient.post<ApiResponse<SwitchWorkspaceResponse>>(
    apiEndpoints.auth.switchWorkspace,
    { organizationId },
  );

  setStoredAccessToken(response.data.data.accessToken);
  return response.data.data;
}

export async function listPermissions() {
  const response = await apiClient.get<ApiResponse<Permission[]>>(apiEndpoints.permissions.list);
  return response.data.data;
}
