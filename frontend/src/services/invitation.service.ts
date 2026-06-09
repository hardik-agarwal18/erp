import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export interface AcceptInvitationPayload {
  token: string;
  name?: string;
  password?: string;
}

export interface AcceptInvitationResponse {
  organizationId: string;
  organizationName: string;
  userId: string;
  membershipId: string;
  role: string;
}

export const acceptInvitation = async (
  payload: AcceptInvitationPayload
): Promise<AcceptInvitationResponse> => {
  const { data } = await apiClient.post<{ data: AcceptInvitationResponse }>(
    apiEndpoints.invitations.accept,
    payload
  );
  return data.data;
};
