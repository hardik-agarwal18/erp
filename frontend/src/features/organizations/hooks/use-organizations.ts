import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMembers, inviteMember, updateMemberRole, removeMember, transferOwnership, getOrganization, updateOrganization, deleteOrganization, getAuditLogs } from "../service";
import type { UpdateOrganizationSchema } from "../schema";
import { useWorkspace } from "@/hooks/use-workspace";
import { listJoinRequests, approveJoinRequest, rejectJoinRequest } from "@/services/organization.service";

export function useMembers() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["organizations", organizationId, "members"],
    queryFn: () => getMembers(organizationId),
    enabled: !!organizationId,
  });
}

export function useAuditLogs() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["organizations", organizationId, "audit-logs"],
    queryFn: () => getAuditLogs(organizationId),
    enabled: !!organizationId,
  });
}

export function useJoinRequests() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["organizations", organizationId, "join-requests"],
    queryFn: () => listJoinRequests(organizationId),
    enabled: !!organizationId,
  });
}

export function useOrganization() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["organizations", organizationId],
    queryFn: () => getOrganization(organizationId),
    enabled: !!organizationId,
  });
}

export function useOrganizationMutations() {
  const queryClient = useQueryClient();
  const { workspace, session, restoreSession } = useWorkspace();
  const organizationId = workspace.id;

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ["organizations", organizationId, "members"] });
    queryClient.invalidateQueries({ queryKey: ["organizations", organizationId, "audit-logs"] });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
  };

  const invalidateJoinRequests = () => {
    queryClient.invalidateQueries({ queryKey: ["organizations", organizationId, "join-requests"] });
  };

  const invite = useMutation({
    mutationFn: (data: Parameters<typeof inviteMember>[1]) => inviteMember(organizationId, data),
    onSuccess: invalidateMembers,
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole(organizationId, memberId, roleId),
    onSuccess: async (_, variables) => {
      invalidateMembers();
      if (variables.memberId === session.id) {
        await restoreSession();
      }
    },
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => removeMember(organizationId, memberId),
    onSuccess: invalidateMembers,
  });

  const transfer = useMutation({
    mutationFn: (memberId: string) => transferOwnership(organizationId, memberId),
    onSuccess: async () => {
      invalidateAll();
      await restoreSession();
    },
  });

  const updateOrg = useMutation({
    mutationFn: (data: UpdateOrganizationSchema) => updateOrganization(organizationId, data),
    onSuccess: async () => {
      invalidateAll();
      await restoreSession();
    },
  });

  const deleteOrg = useMutation({
    mutationFn: () => deleteOrganization(organizationId),
    onSuccess: async () => {
      invalidateAll(); // Invalidate ["organizations"] before removing deleted
      queryClient.removeQueries({ queryKey: ["organizations", organizationId] });
      await restoreSession();
    },
  });

  const approveRequest = useMutation({
    mutationFn: (requestId: string) => approveJoinRequest({ organizationId, requestId }),
    onSuccess: () => {
      invalidateJoinRequests();
      invalidateMembers();
    },
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId: string) => rejectJoinRequest({ organizationId, requestId }),
    onSuccess: invalidateJoinRequests,
  });

  return {
    inviteMember: invite,
    updateMemberRole: updateRole,
    removeMember: remove,
    transferOwnership: transfer,
    updateOrganization: updateOrg,
    deleteOrganization: deleteOrg,
    approveJoinRequest: approveRequest,
    rejectJoinRequest: rejectRequest,
  };
}
