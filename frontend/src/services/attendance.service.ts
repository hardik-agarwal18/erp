import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "OVERTIME";

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workHours?: number;
  overtimeHours?: number;
  employee: {
    firstName: string;
    lastName: string;
    designation?: { name: string };
  };
};

export type AttendanceSummary = {
  employeeId: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalOvertimeHours: number;
  totalWorkHours: number;
};

export const attendanceService = {
  checkIn: async (data: { employeeId: string; checkInTime: string; locationInfo?: any }) => {
    const res = await apiClient.post<{ data: AttendanceRecord }>(apiEndpoints.hrms.attendance + "/check-in", data);
    return res.data.data;
  },

  checkOut: async (data: { employeeId: string; checkOutTime: string }) => {
    const res = await apiClient.post<{ data: AttendanceRecord }>(apiEndpoints.hrms.attendance + "/check-out", data);
    return res.data.data;
  },

  getSummary: async (startDate: string, endDate: string) => {
    const res = await apiClient.get<{ data: AttendanceSummary[] }>(apiEndpoints.hrms.attendance + "/summary", {
      params: { startDate, endDate }
    });
    return res.data.data;
  },

  requestAdjustment: async (data: { employeeId: string; date: string; newStatus: AttendanceStatus; newCheckIn?: string; newCheckOut?: string; reason: string }) => {
    const res = await apiClient.post<{ data: AttendanceRecord }>(apiEndpoints.hrms.attendance + "/adjust", data);
    return res.data.data;
  }
};
