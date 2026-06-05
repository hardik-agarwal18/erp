import { useQuery } from "@tanstack/react-query";
import { getPayments } from "../service";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => getPayments(),
  });
}
