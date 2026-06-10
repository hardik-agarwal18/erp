import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useWorkspace } from "@/hooks/use-workspace";

import { archiveTax, createTax, updateTax } from "../service";

export function useTaxMutations() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const create = useMutation({
    mutationFn: createTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes", workspace.id] });
      toast.success("Tax created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tax", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTax>[1] }) => updateTax(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taxes", workspace.id] });
      queryClient.invalidateQueries({ queryKey: ["taxes", workspace.id, variables.id] });
      toast.success("Tax updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update tax", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    },
  });

  const archive = useMutation({
    mutationFn: archiveTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes", workspace.id] });
      toast.success("Tax archived successfully");
    },
    onError: (error) => {
      toast.error("Failed to archive tax", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    },
  });

  return {
    createTax: create,
    updateTax: update,
    archiveTax: archive,
  };
}
