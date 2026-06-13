import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import { ApprovalInstance } from "@/types/app";

export const approvalService = {
  getPendingApprovals: async () => {
    return apiClient.get<ApprovalInstance[]>(apiEndpoints.approvals.pending);
  },

  approve: async (id: string, notes?: string) => {
    return apiClient.post<{ message: string; data: ApprovalInstance }>(
      apiEndpoints.approvals.approve(id),
      { notes }
    );
  },

  reject: async (id: string, notes?: string) => {
    return apiClient.post<{ message: string; data: ApprovalInstance }>(
      apiEndpoints.approvals.reject(id),
      { notes }
    );
  },
};
