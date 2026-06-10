import { useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { getTaxes } from "../service";

export function useTaxesQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ["taxes", workspace.id],
    queryFn: () => getTaxes(),
  });
}
