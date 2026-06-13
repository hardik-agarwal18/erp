import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import { StockJournal } from "@/types/app";

export const stockJournalService = {
  list: async () => {
    return apiClient.get<StockJournal[]>(apiEndpoints.inventory.stockJournals.list);
  },

  getDetails: async (id: string) => {
    return apiClient.get<StockJournal>(apiEndpoints.inventory.stockJournals.details(id));
  },

  create: async (data: Partial<StockJournal>) => {
    return apiClient.post<{ message: string; data: StockJournal }>(
      apiEndpoints.inventory.stockJournals.create,
      data
    );
  },

  post: async (id: string) => {
    return apiClient.post<{ message: string; data: StockJournal }>(
      apiEndpoints.inventory.stockJournals.post(id),
      {}
    );
  },
};
