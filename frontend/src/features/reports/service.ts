import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";

export type ExportResponse = {
  jobId: string;
};

export type ExportStatusResponse = {
  id: string;
  status: string;
  url?: string;
};

export async function requestExport(params: { reportType: string; startDate?: string; endDate?: string; frequency?: string }) {
  const response = await apiClient.post<ApiResponse<ExportResponse>>(apiEndpoints.reports.export, params);
  return response.data.data;
}

export async function checkExportStatus(jobId: string) {
  const response = await apiClient.get<ApiResponse<ExportStatusResponse>>(apiEndpoints.reports.exportStatus(jobId));
  return response.data.data;
}
