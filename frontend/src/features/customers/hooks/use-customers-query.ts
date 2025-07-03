"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { createCustomer, getCustomerById, getCustomers, updateCustomer } from "../service";

export function useCustomersQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.customers(workspace.id),
    queryFn: getCustomers,
  });
}

export function useCustomerDetailQuery(customerId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.customerDetail(workspace.id, customerId),
    queryFn: () => getCustomerById(customerId),
  });
}

export function useCreateCustomerMutation() {
  return useMutation({
    mutationFn: createCustomer,
  });
}

export function useUpdateCustomerMutation(customerId: string) {
  return useMutation({
    mutationFn: (values: Parameters<typeof updateCustomer>[1]) => updateCustomer(customerId, values),
  });
}
