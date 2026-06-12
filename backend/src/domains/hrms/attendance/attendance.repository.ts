
import prisma from "../../../../config/database.js";
import { AttendanceStatus } from "@prisma/client";

export const attendanceRepository = {
  getRecord: async (organizationId: string, employeeId: string, date: Date) => {
    return prisma.attendanceRecord.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId,
          date,
        },
      },
      include: { employee: true },
    });
  },

  createRecord: async (
    organizationId: string,
    employeeId: string,
    date: Date,
    status: AttendanceStatus,
    shiftId?: string,
    checkIn?: Date,
    notes?: string
  ) => {
    return prisma.attendanceRecord.create({
      data: {
        organizationId,
        employeeId,
        date,
        status,
        shiftId,
        checkIn,
        notes,
      },
    });
  },

  updateRecord: async (id: string, updates: Partial<any>) => {
    return prisma.attendanceRecord.update({
      where: { id },
      data: updates,
    });
  },

  getPolicy: async (organizationId: string) => {
    return prisma.attendancePolicy.findFirst({
      where: { organizationId },
    });
  },

  getActiveShiftAssignment: async (organizationId: string, employeeId: string, date: Date) => {
    return prisma.employeeShiftAssignment.findFirst({
      where: {
        organizationId,
        employeeId,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      include: { shift: true },
    });
  },

  createAdjustment: async (data: any) => {
    return prisma.attendanceAdjustment.create({
      data,
    });
  },

  getMonthlyRecords: async (organizationId: string, employeeId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        employeeId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
  },

  getPeriod: async (organizationId: string, month: number, year: number) => {
    return prisma.attendancePeriod.findUnique({
      where: {
        organizationId_month_year: {
          organizationId,
          month,
          year,
        },
      },
    });
  },
};
