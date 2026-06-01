"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { useWorkspace } from "@/hooks/use-workspace";
import { createInvoice, getInvoiceById, getInvoices, updateInvoice } from "../service";

export function useInvoicesQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.invoices(workspace.id),
    queryFn: getInvoices,
  });
}

export function useInvoiceDetailQuery(invoiceId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.invoiceDetail(workspace.id, invoiceId),
    queryFn: () => getInvoiceById(invoiceId),
  });
}

export function useCreateInvoiceMutation() {
  return useMutation({
    mutationFn: createInvoice,
  });
}

export function useUpdateInvoiceMutation(invoiceId: string) {
  return useMutation({
    mutationFn: (values: Parameters<typeof updateInvoice>[1]) => updateInvoice(invoiceId, values),
  });
}
