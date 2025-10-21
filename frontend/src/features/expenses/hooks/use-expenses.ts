import { useQuery } from "@tanstack/react-query";
import { getExpenses } from "../service";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses(),
  });
}
