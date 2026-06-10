import { useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { getTaxById } from "../service";

export function useTaxQuery(taxId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ["taxes", workspace.id, taxId],
    queryFn: () => getTaxById(taxId),
    enabled: !!taxId,
  });
}
