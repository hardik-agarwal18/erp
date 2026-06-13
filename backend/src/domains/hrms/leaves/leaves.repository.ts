
import prisma from "../../../config/database.js";
import { ApplyForLeaveInput } from "./leaves.types.js";
import { LeaveStatus } from "@prisma/client";

export const leavesRepository = {
  createApplication: async (organizationId: string, payload: ApplyForLeaveInput) => {
    return prisma.leaveApplication.create({
      data: {
        organizationId,
        employeeId: payload.employeeId,
        leaveTypeId: payload.leaveTypeId,
        fromDate: new Date(payload.fromDate),
        toDate: new Date(payload.toDate),
        totalDays: payload.totalDays,
        reason: payload.reason,
        status: LeaveStatus.DRAFT,
      },
      include: {
        leaveType: true,
      },
    });
  },

  getApplicationById: async (organizationId: string, id: string) => {
    return prisma.leaveApplication.findFirst({
      where: { organizationId, id },
      include: { leaveType: true },
    });
  },

  listApplications: async (organizationId: string, employeeId?: string) => {
    return prisma.leaveApplication.findMany({
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        leaveType: true,
        employee: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateApplicationStatus: async (id: string, status: LeaveStatus) => {
    return prisma.leaveApplication.update({
      where: { id },
      data: { status },
      include: { leaveType: true },
    });
  },

  getBalance: async (organizationId: string, employeeId: string, leaveTypeId: string) => {
    return prisma.leaveBalance.findUnique({
      where: {
        organizationId_employeeId_leaveTypeId: {
          organizationId,
          employeeId,
          leaveTypeId,
        },
      },
    });
  },

  getBalancesByEmployee: async (organizationId: string, employeeId: string) => {
    return prisma.leaveBalance.findMany({
      where: {
        organizationId,
        employeeId,
      },
      include: {
        leaveType: true,
      },
    });
  },

  deductBalance: async (organizationId: string, employeeId: string, leaveTypeId: string, days: number) => {
    return prisma.leaveBalance.update({
      where: {
        organizationId_employeeId_leaveTypeId: {
          organizationId,
          employeeId,
          leaveTypeId,
        },
      },
      data: {
        used: { increment: days },
        remaining: { decrement: days },
      },
    });
  },

  restoreBalance: async (organizationId: string, employeeId: string, leaveTypeId: string, days: number) => {
    return prisma.leaveBalance.update({
      where: {
        organizationId_employeeId_leaveTypeId: {
          organizationId,
          employeeId,
          leaveTypeId,
        },
      },
      data: {
        used: { decrement: days },
        remaining: { increment: days },
      },
    });
  },
};
