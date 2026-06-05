import { useQuery } from "@tanstack/react-query";
import { getPaymentById } from "../service";

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ["payments", paymentId],
    queryFn: () => getPaymentById(paymentId),
    enabled: !!paymentId,
  });
}
