import type { FeatureKey } from "@/types/app";
import { useWorkspace } from "./use-workspace";

export function useRbac(feature: FeatureKey) {
  const { canAccess, hasPermission, hasRole } = useWorkspace();

  return {
    canAccess: canAccess(feature),
    hasPermission,
    hasRole,
  };
}
