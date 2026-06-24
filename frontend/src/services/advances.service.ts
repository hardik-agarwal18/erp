import { apiClient } from "@/api/client";

export interface Advance {
  id: string;
  advanceNumber: string;
  type: string;
  amount: string;
  outstandingAmount: string;
  dueDate: string;
  status: string;
  employeeId?: string;
  vendorId?: string;
  customerId?: string;
  notes?: string;
  createdAt: string;
}

export interface AdvanceSettlement {
  id: string;
  settlementNumber: string;
  type: string;
  amount: string;
  settlementDate: string;
  advance: Advance;
  reversedAt?: string;
}

export interface AdvanceTimelineEvent {
  id: string;
  eventType: string;
  date: string;
  amount?: number;
  reference?: string;
  metadata?: any;
}

export const getAdvances = async (params?: Record<string, any>): Promise<Advance[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/advances", { params });
  return data;
};

export const getAdvanceSettlements = async (params?: Record<string, any>): Promise<AdvanceSettlement[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/advances/settlements", { params });
  return data;
};

export const getAdvanceTimeline = async (id: string): Promise<AdvanceTimelineEvent[]> => {
  const { data } = await apiClient.get(`/api/v1/treasury/advances/${id}/timeline`);
  return data;
};
