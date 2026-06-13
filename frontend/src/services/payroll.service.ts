import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type ComponentType = "EARNING" | "DEDUCTION";

export type SalaryComponent = {
  id: string;
  name: string;
  type: ComponentType;
  isTaxable: boolean;
  isPercentage: boolean;
  basePercentage?: number;
};

import { PayrollRunStatus } from "@/types/app";

export type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
};

export const payrollService = {
  listComponents: async () => {
    const res = await apiClient.get<{ data: SalaryComponent[] }>(`${apiEndpoints.hrms.payroll}/components`);
    return res.data.data;
  },

  createComponent: async (data: Omit<SalaryComponent, "id">) => {
    const res = await apiClient.post<{ data: SalaryComponent }>(`${apiEndpoints.hrms.payroll}/components`, data);
    return res.data.data;
  },

  getPayrollRun: async (id: string) => {
    const res = await apiClient.get<{ data: PayrollRun }>(`${apiEndpoints.hrms.payroll}/runs/${id}`);
    return res.data.data;
  },

  listRuns: async () => {
    // Note: The backend might not have a dedicated /runs endpoint if it's not in routes, but we added apiEndpoints.hrms.payrollRuns.list
    const res = await apiClient.get<{ data: PayrollRun[] }>(apiEndpoints.hrms.payrollRuns.list);
    return res.data.data;
  },

  generatePayroll: async (data: { month: number; year: number }) => {
    const res = await apiClient.post<{ data: PayrollRun }>(apiEndpoints.hrms.payrollRuns.generate, data);
    return res.data.data;
  },

  submitForApproval: async (id: string) => {
    const res = await apiClient.post<{ message: string }>(apiEndpoints.hrms.payrollRuns.submit(id), {});
    return res.data;
  },
  
  getMyPayslips: async () => {
    const res = await apiClient.get<{ data: any[] }>(apiEndpoints.hrms.myPayslips.list);
    return res.data.data;
  },

  getPayslipDetails: async (id: string) => {
    const res = await apiClient.get<{ data: any }>(apiEndpoints.hrms.myPayslips.details(id));
    return res.data.data;
  },

  downloadPayslipPdf: async (id: string) => {
    // We need to request this as a blob to download it
    const res = await apiClient.get(`${apiEndpoints.hrms.myPayslips.details(id)}/pdf`, {
      responseType: 'blob'
    });
    return res.data;
  }
};
