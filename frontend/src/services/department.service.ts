import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import { Department } from "@/types/app";

export const departmentService = {
  list: async () => {
    return apiClient.get<Department[]>(apiEndpoints.hrms.departments.list);
  },

  getDetails: async (id: string) => {
    return apiClient.get<Department>(apiEndpoints.hrms.departments.details(id));
  },

  create: async (data: Partial<Department>) => {
    return apiClient.post<{ message: string; data: Department }>(
      apiEndpoints.hrms.departments.create,
      data
    );
  },

  update: async (id: string, data: Partial<Department>) => {
    return apiClient.put<{ message: string; data: Department }>(
      apiEndpoints.hrms.departments.update(id),
      data
    );
  },

  delete: async (id: string) => {
    return apiClient.delete<{ message: string }>(
      apiEndpoints.hrms.departments.delete(id)
    );
  },
};
