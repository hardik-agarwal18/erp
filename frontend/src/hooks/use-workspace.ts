import { useWorkspaceContext } from "@/providers/workspace-provider";

export function useWorkspace() {
  return useWorkspaceContext();
}
