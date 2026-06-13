import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type Shift = {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  isActive: boolean;
};

export const shiftService = {
  listShifts: async (isActive?: boolean) => {
    const res = await apiClient.get<{ data: Shift[] }>(apiEndpoints.hrms.shifts, { params: { isActive } });
    return res.data.data;
  },

  createShift: async (data: Omit<Shift, "id">) => {
    const res = await apiClient.post<{ data: Shift }>(apiEndpoints.hrms.shifts, data);
    return res.data.data;
  },

  updateShift: async (id: string, data: Partial<Omit<Shift, "id">>) => {
    const res = await apiClient.patch<{ data: Shift }>(`${apiEndpoints.hrms.shifts}/${id}`, data);
    return res.data.data;
  },

  deleteShift: async (id: string) => {
    await apiClient.delete(`${apiEndpoints.hrms.shifts}/${id}`);
  },

  getDashboardMetrics: async () => {
    const res = await apiClient.get<{ data: any }>(`${apiEndpoints.hrms.shifts}/dashboard/metrics`);
    return res.data.data;
  }
};
