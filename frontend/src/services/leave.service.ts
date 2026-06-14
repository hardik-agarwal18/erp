import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type LeaveType = "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "MATERNITY" | "PATERNITY" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type LeaveApplication = {
  id: string;
  organizationId: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  appliedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    designation?: { name: string };
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type ListLeavesFilters = {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
};

export type LeaveApplicationRequest = {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
};

export type LeaveApprovalRequest = {
  comments?: string;
};

export type LeaveBalance = {
  id: string;
  leaveTypeId: string;
  total: number;
  used: number;
  remaining: number;
  leaveType: {
    id: string;
    name: string;
    isPaid: boolean;
  };
};

export const leaveService = {
  listLeaves: async (filters?: ListLeavesFilters) => {
    const res = await apiClient.get<{ data: LeaveApplication[], total: number }>(apiEndpoints.hrms.leaves, { params: filters });
    return res.data;
  },

  getLeaveDetails: async (leaveId: string) => {
    const res = await apiClient.get<{ data: LeaveApplication }>(apiEndpoints.hrms.leaveDetails(leaveId));
    return res.data.data;
  },

  applyForLeave: async (data: LeaveApplicationRequest) => {
    const res = await apiClient.post<{ data: LeaveApplication }>(apiEndpoints.hrms.leaves, data);
    return res.data.data;
  },

  approveLeave: async (leaveId: string, data?: LeaveApprovalRequest) => {
    const res = await apiClient.post<{ data: LeaveApplication }>(apiEndpoints.hrms.leaveApproval(leaveId), data);
    return res.data.data;
  },

  rejectLeave: async (leaveId: string, data?: LeaveApprovalRequest) => {
    const res = await apiClient.post<{ data: LeaveApplication }>(apiEndpoints.hrms.leaveRejection(leaveId), data);
    return res.data.data;
  },

  cancelLeave: async (leaveId: string) => {
    const res = await apiClient.delete(apiEndpoints.hrms.leaveDetails(leaveId));
    return res.data;
  },

  getMyBalances: async () => {
    const res = await apiClient.get<{ data: LeaveBalance[] }>("/leaves/balances/me");
    return res.data;
  },

  getEmployeeBalances: async (employeeId: string) => {
    const res = await apiClient.get<{ data: LeaveBalance[] }>(`/leaves/balances/${employeeId}`);
    return res.data;
  }
};
