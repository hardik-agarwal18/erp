
import { AttendanceStatus } from "@prisma/client";

export interface CheckInInput {
  employeeId: string;
  time?: Date | string; // defaults to now
  notes?: string;
}

export interface CheckOutInput {
  employeeId: string;
  time?: Date | string; // defaults to now
  notes?: string;
}

export interface RequestAdjustmentInput {
  employeeId: string;
  date: Date | string;
  newStatus: AttendanceStatus;
  newCheckIn?: Date | string;
  newCheckOut?: Date | string;
  reason: string;
}

export interface PayrollSummary {
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  unpaidDays: number;
  halfDays: number;
  overtimeHours: number;
  lateDays: number;
}
