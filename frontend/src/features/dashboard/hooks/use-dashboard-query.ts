"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { useWorkspace } from "@/hooks/use-workspace";
import { getDashboardSnapshot } from "../service";

export function useDashboardQuery() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.dashboard(workspace.id),
    queryFn: getDashboardSnapshot,
  });
}
