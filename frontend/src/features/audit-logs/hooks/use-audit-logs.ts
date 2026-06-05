import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../service";
import { useWorkspace } from "@/hooks/use-workspace";

export function useAuditLogs() {
  const { workspace } = useWorkspace();
  const organizationId = workspace.id;

  return useQuery({
    queryKey: ["audit-logs", organizationId],
    queryFn: () => getAuditLogs(organizationId),
    enabled: !!organizationId,
  });
}
