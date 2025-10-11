import { useQuery } from "@tanstack/react-query";
import { getExpenseById } from "../service";

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: ["expenses", expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId,
  });
}
