"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { useWorkspace } from "@/hooks/use-workspace";
import { createGoodsReceivedNote, createPurchaseOrder, getGoodsReceivedNotes, getPurchaseById, getPurchases } from "../service";

export function usePurchasesQuery() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.purchases(workspace.id),
    queryFn: getPurchases,
  });
}

export function usePurchaseDetailQuery(purchaseId: string) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.purchaseDetail(workspace.id, purchaseId),
    queryFn: () => getPurchaseById(purchaseId),
  });
}

export function useGoodsReceivedNotesQuery() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.purchaseReceipts(workspace.id),
    queryFn: getGoodsReceivedNotes,
  });
}

export function useCreatePurchaseMutation() {
  return useMutation({
    mutationFn: createPurchaseOrder,
  });
}

export function useCreateGoodsReceivedNoteMutation() {
  return useMutation({
    mutationFn: createGoodsReceivedNote,
  });
}
