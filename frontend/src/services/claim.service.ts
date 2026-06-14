import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type ExpenseClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "REIMBURSED";

export type ExpenseClaim = {
  id: string;
  organizationId: string;
  employeeId: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  receiptUrl?: string;
  status: ExpenseClaimStatus;
  approvedById?: string;
  reimbursedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  approvedBy?: {
    name: string;
  };
};

export const claimService = {
  listClaims: async (status?: ExpenseClaimStatus) => {
    const res = await apiClient.get<{ data: ExpenseClaim[] }>(apiEndpoints.hrms.claims, { params: { status } });
    return res.data.data;
  },

  submitClaim: async (data: {
    date: string;
    category: string;
    amount: number;
    currency?: string;
    description?: string;
    receiptUrl?: string;
  }) => {
    const res = await apiClient.post<{ data: ExpenseClaim }>(apiEndpoints.hrms.claims, data);
    return res.data.data;
  },

  getClaim: async (id: string) => {
    const res = await apiClient.get<{ data: ExpenseClaim }>(`${apiEndpoints.hrms.claims}/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, status: ExpenseClaimStatus) => {
    const res = await apiClient.patch<{ data: ExpenseClaim }>(`${apiEndpoints.hrms.claims}/${id}/status`, { status });
    return res.data.data;
  }
};
