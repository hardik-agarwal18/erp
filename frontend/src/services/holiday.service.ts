import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type HolidayType = "PUBLIC" | "COMPANY" | "OPTIONAL";

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
};

export const holidayService = {
  listHolidays: async (year?: number) => {
    const res = await apiClient.get<{ data: Holiday[] }>(apiEndpoints.hrms.holidays, { params: { year } });
    return res.data.data;
  },

  createHoliday: async (data: Omit<Holiday, "id">) => {
    const res = await apiClient.post<{ data: Holiday }>(apiEndpoints.hrms.holidays, data);
    return res.data.data;
  },

  updateHoliday: async (id: string, data: Partial<Omit<Holiday, "id">>) => {
    const res = await apiClient.patch<{ data: Holiday }>(`${apiEndpoints.hrms.holidays}/${id}`, data);
    return res.data.data;
  },

  deleteHoliday: async (id: string) => {
    await apiClient.delete(`${apiEndpoints.hrms.holidays}/${id}`);
  }
};
