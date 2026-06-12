import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Employee, EmployeeStatus, EmploymentType, Department, Designation } from "@/types/app";

export type HrmsDashboardResponse = {
  kpis: Array<{
    label: string;
    value: number;
    trend?: number;
    detail: string;
  }>;
  recentHires: Employee[];
  upcomingBirthdays: Employee[];
};

export type EmployeeListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmployeeStatus;
  departmentId?: string;
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  officialEmail?: string;
  personalEmail?: string;
  phone?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  departmentId?: string;
  designationId?: string;
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

export async function getHrmsDashboard() {
  const response = await apiClient.get<ApiResponse<HrmsDashboardResponse>>(apiEndpoints.hrms.dashboard);
  return response.data.data;
}

export async function getEmployees(params?: EmployeeListParams) {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Employee>>>(apiEndpoints.hrms.employees, { params });
  return response.data.data;
}

export async function getEmployee(id: string) {
  const response = await apiClient.get<ApiResponse<Employee>>(apiEndpoints.hrms.employeeDetails(id));
  return response.data.data;
}

export async function createEmployee(payload: CreateEmployeePayload) {
  const response = await apiClient.post<ApiResponse<Employee>>(apiEndpoints.hrms.employees, payload);
  return response.data.data;
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload) {
  const response = await apiClient.patch<ApiResponse<Employee>>(apiEndpoints.hrms.employeeDetails(id), payload);
  return response.data.data;
}
