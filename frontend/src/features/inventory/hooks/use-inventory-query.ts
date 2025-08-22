"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { useWorkspace } from "@/hooks/use-workspace";
import { createStockAdjustment, createStockTransfer, getInventoryManagement, saveWarehouseSettings, scheduleInventoryAudit } from "../service";

export function useInventoryManagementQuery() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: queryKeys.inventory(workspace.id),
    queryFn: getInventoryManagement,
  });
}

export function useInventoryQuery() {
  return useInventoryManagementQuery();
}

export function useCreateStockAdjustmentMutation() {
  return useMutation({
    mutationFn: createStockAdjustment,
  });
}

export function useCreateStockTransferMutation() {
  return useMutation({
    mutationFn: createStockTransfer,
  });
}

export function useScheduleInventoryAuditMutation() {
  return useMutation({
    mutationFn: scheduleInventoryAudit,
  });
}

export function useSaveWarehouseSettingsMutation() {
  return useMutation({
    mutationFn: saveWarehouseSettings,
  });
}
