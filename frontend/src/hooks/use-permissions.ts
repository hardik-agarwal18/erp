import { useMemo } from "react";
import { useWorkspaceContext } from "@/providers/workspace-provider";
import { hasPermission as checkHasPermission, hasAnyPermission as checkHasAnyPermission, hasAllPermissions as checkHasAllPermissions } from "@/utils/permissions";

export function usePermissions() {
  const { permissions } = useWorkspaceContext();

  return useMemo(() => ({
    hasPermission: (permission: string) => checkHasPermission(permissions, permission),
    hasAnyPermission: (requiredPermissions: string[]) => checkHasAnyPermission(permissions, requiredPermissions),
    hasAllPermissions: (requiredPermissions: string[]) => checkHasAllPermissions(permissions, requiredPermissions),
  }), [permissions]);
}
