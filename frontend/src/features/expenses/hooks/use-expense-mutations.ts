import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense, updateExpense, deleteExpense } from "../service";

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: Parameters<typeof updateExpense>[1] }) =>
      updateExpense(expenseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.expenseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return {
    createExpense: createMutation,
    updateExpense: updateMutation,
    deleteExpense: deleteMutation,
  };
}
