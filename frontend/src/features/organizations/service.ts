import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { OrganizationMember, MemberRole, OrganizationDTO, InvitationDTO, OrganizationMemberDTO } from "./types";
import type { InviteMemberSchema, UpdateOrganizationSchema } from "./schema";

type BackendMember = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  role: {
    name: string;
  };
  joinedAt: string;
};

export async function getOrganization(organizationId: string) {
  const response = await apiClient.get<ApiResponse<OrganizationDTO>>(apiEndpoints.organizations.details(organizationId));
  return response.data.data;
}

export async function updateOrganization(organizationId: string, input: UpdateOrganizationSchema) {
  const payload = {
    name: input.name,
    settings: {
      legalName: input.legalName,
      currency: input.currency,
      timezone: input.timezone,
      description: input.description,
    },
  };
  const response = await apiClient.patch<ApiResponse<OrganizationDTO>>(apiEndpoints.organizations.details(organizationId), payload);
  return response.data.data;
}

export async function getMembers(organizationId: string) {
  const response = await apiClient.get<ApiResponse<BackendMember[]>>(apiEndpoints.organizations.members(organizationId));
  return response.data.data.map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role.name.toLowerCase() as MemberRole,
    joinedAt: member.joinedAt.slice(0, 10),
  }));
}

export async function inviteMember(organizationId: string, input: InviteMemberSchema) {
  const response = await apiClient.post<ApiResponse<InvitationDTO>>(apiEndpoints.organizations.invite(organizationId), input);
  return response.data.data;
}

export async function updateMemberRole(organizationId: string, memberId: string, roleId: string) {
  const response = await apiClient.patch<ApiResponse<OrganizationMemberDTO>>(apiEndpoints.organizations.updateMember(organizationId, memberId), {
    roleId,
  });
  return response.data.data;
}

export async function removeMember(organizationId: string, memberId: string) {
  await apiClient.delete(apiEndpoints.organizations.removeMember(organizationId, memberId));
}

export async function transferOwnership(organizationId: string, memberId: string) {
  await apiClient.post(apiEndpoints.organizations.transferOwnership(organizationId), {
    memberId,
  });
}

export async function deleteOrganization(organizationId: string) {
  await apiClient.delete(apiEndpoints.organizations.details(organizationId));
}
