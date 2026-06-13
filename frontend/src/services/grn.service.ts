import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import { GRN } from "@/types/app";

export const grnService = {
  list: async () => {
    return apiClient.get<GRN[]>(apiEndpoints.inventory.grn.list);
  },

  getDetails: async (id: string) => {
    return apiClient.get<GRN>(apiEndpoints.inventory.grn.details(id));
  },

  create: async (data: Partial<GRN>) => {
    return apiClient.post<{ message: string; data: GRN }>(
      apiEndpoints.inventory.grn.create,
      data
    );
  },

  receive: async (id: string, action: "FULL" | "PARTIAL" | "REJECT", items?: any[]) => {
    return apiClient.post<{ message: string; data: GRN }>(
      apiEndpoints.inventory.grn.receive(id),
      { action, items }
    );
  },
};
