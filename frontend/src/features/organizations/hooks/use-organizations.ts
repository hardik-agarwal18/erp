import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMembers, inviteMember, updateMemberRole, removeMember, transferOwnership } from "../service";
import { useWorkspace } from "@/hooks/use-workspace";

export function useMembers() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["organizations", organizationId, "members"],
    queryFn: () => getMembers(organizationId),
    enabled: !!organizationId,
  });
}

export function useOrganizationMutations() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["organizations", organizationId, "members"] });
  };

  const invite = useMutation({
    mutationFn: (data: Parameters<typeof inviteMember>[1]) => inviteMember(organizationId, data),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole(organizationId, memberId, roleId),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => removeMember(organizationId, memberId),
    onSuccess: invalidate,
  });

  const transfer = useMutation({
    mutationFn: (memberId: string) => transferOwnership(organizationId, memberId),
    onSuccess: invalidate,
  });

  return {
    inviteMember: invite,
    updateMemberRole: updateRole,
    removeMember: remove,
    transferOwnership: transfer,
  };
}
