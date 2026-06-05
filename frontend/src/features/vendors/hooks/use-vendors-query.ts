"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { createVendor, getVendorById, getVendors, updateVendor } from "../service";

export function useVendorsQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.vendors(workspace.id),
    queryFn: getVendors,
  });
}

export function useVendorDetailQuery(vendorId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.vendorDetail(workspace.id, vendorId),
    queryFn: () => getVendorById(vendorId),
  });
}

export function useCreateVendorMutation() {
  return useMutation({
    mutationFn: createVendor,
  });
}

export function useUpdateVendorMutation(vendorId: string) {
  return useMutation({
    mutationFn: (values: Parameters<typeof updateVendor>[1]) => updateVendor(vendorId, values),
  });
}
