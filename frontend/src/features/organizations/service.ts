import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { OrganizationMember, MemberRole } from "./types";
import type { InviteMemberSchema } from "./schema";

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
  const response = await apiClient.post<ApiResponse<any>>(apiEndpoints.organizations.invite(organizationId), input);
  return response.data;
}

export async function updateMemberRole(organizationId: string, memberId: string, roleId: string) {
  const response = await apiClient.patch<ApiResponse<any>>(apiEndpoints.organizations.updateMember(organizationId, memberId), {
    roleId,
  });
  return response.data;
}

export async function removeMember(organizationId: string, memberId: string) {
  await apiClient.delete(apiEndpoints.organizations.removeMember(organizationId, memberId));
}

export async function transferOwnership(organizationId: string, memberId: string) {
  await apiClient.post(apiEndpoints.organizations.transferOwnership(organizationId), {
    memberId,
  });
}
