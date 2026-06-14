"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { createBankReconciliation, getReconciliations, getTransactionById, getTransactions } from "../service";

export function useTransactionsQuery(page: number = 1, limit: number = 10) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: [...queryKeys.transactions(workspace.id), page, limit],
    queryFn: () => getTransactions(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useTransactionDetailQuery(transactionId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.transactionDetail(workspace.id, transactionId),
    queryFn: () => getTransactionById(transactionId),
  });
}

export function useReconciliationsQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.transactionReconciliation(workspace.id),
    queryFn: getReconciliations,
  });
}

export function useCreateBankReconciliationMutation() {
  return useMutation({
    mutationFn: createBankReconciliation,
  });
}
