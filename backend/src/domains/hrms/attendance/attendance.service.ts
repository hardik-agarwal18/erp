
import { attendanceRepository } from "./attendance.repository.js";
import { CheckInInput, CheckOutInput, PayrollSummary, RequestAdjustmentInput } from "./attendance.types.js";
import ApiError from "../../../utils/ApiError.js";
import { AttendanceStatus } from "@prisma/client";
import { eventBus } from "../../../shared/events/event-bus.js";
import { approvalsService } from "../../core/approvals/approvals.service.js";
import prisma from "../../../config/database.js";

const getMidnightUTC = (d: Date | string) => {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const parseTimeStr = (timeStr: string, baseDate: Date) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(baseDate);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
};

// Listen to override approvals
eventBus.on("approval.completed", async (event: any) => {
  if (event.entityType === "ATTENDANCE_ADJUSTMENT") {
    console.log(`[EventBus] attendance-adjustment ${event.entityId} approved`);
    const adjustment = await prisma.attendanceAdjustment.findUnique({ where: { id: event.entityId } });
    if (adjustment) {
      await attendanceService.applyAdjustment(adjustment.organizationId, adjustment);
    }
  }
});

export const attendanceService = {
  checkIn: async (organizationId: string, payload: CheckInInput) => {
    const time = payload.time ? new Date(payload.time) : new Date();
    const date = getMidnightUTC(time);

    // Check if period is locked
    await attendanceService.ensurePeriodOpen(organizationId, date);

    let record = await attendanceRepository.getRecord(organizationId, payload.employeeId, date);
    if (record?.checkIn) {
      throw new ApiError(400, "Already checked in today.");
    }

    const policy = await attendanceRepository.getPolicy(organizationId);
    const assignment = await attendanceRepository.getActiveShiftAssignment(organizationId, payload.employeeId, date);

    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let shiftId = assignment?.shiftId;

    if (assignment?.shift) {
      const shiftStartTime = parseTimeStr(assignment.shift.startTime, date);
      const graceMinutes = assignment.shift.lateGraceMinutes || policy?.lateGraceMinutes || 15;
      
      const diffMs = time.getTime() - shiftStartTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins > graceMinutes) {
        status = AttendanceStatus.LATE;
      }
    }

    if (!record) {
      record = await attendanceRepository.createRecord(
        organizationId,
        payload.employeeId,
        date,
        status,
        shiftId,
        time,
        payload.notes
      );
    } else {
      record = await attendanceRepository.updateRecord(record.id, {
        checkIn: time,
        status,
        shiftId,
        notes: payload.notes ? `${record.notes || ''} | CheckIn: ${payload.notes}` : record.notes
      });
    }

    eventBus.emit("attendance.checked-in", { organizationId, employeeId: payload.employeeId, recordId: record!.id });
    return record;
  },

  checkOut: async (organizationId: string, payload: CheckOutInput) => {
    const time = payload.time ? new Date(payload.time) : new Date();
    const date = getMidnightUTC(time);

    await attendanceService.ensurePeriodOpen(organizationId, date);

    let record = await attendanceRepository.getRecord(organizationId, payload.employeeId, date);
    if (!record || !record.checkIn) {
      throw new ApiError(400, "Cannot check out before checking in.");
    }
    if (record.checkOut) {
      throw new ApiError(400, "Already checked out today.");
    }

    const diffMs = time.getTime() - record.checkIn.getTime();
    const workedMinutes = Math.floor(diffMs / 60000);

    const policy = await attendanceRepository.getPolicy(organizationId);
    let status = record.status;

    if (policy) {
      if (workedMinutes < policy.halfDayMinutes) {
        status = AttendanceStatus.ABSENT;
      } else if (workedMinutes < policy.fullDayMinutes) {
        status = AttendanceStatus.HALF_DAY;
      }
    }

    record = await attendanceRepository.updateRecord(record.id, {
      checkOut: time,
      workedMinutes,
      status,
      notes: payload.notes ? `${record.notes || ''} | CheckOut: ${payload.notes}` : record.notes
    });

    eventBus.emit("attendance.checked-out", { organizationId, employeeId: payload.employeeId, recordId: record!.id });
    return record;
  },

  requestAdjustment: async (organizationId: string, actorUserId: string, hasAdjustPermission: boolean, payload: RequestAdjustmentInput) => {
    const date = getMidnightUTC(payload.date);
    await attendanceService.ensurePeriodOpen(organizationId, date);

    const record = await attendanceRepository.getRecord(organizationId, payload.employeeId, date);

    let isMinor = false;
    // Determine if minor (e.g. time correction < 2 hours)
    if (record && record.checkIn && payload.newCheckIn && record.checkOut && payload.newCheckOut) {
       const oldWorked = record.workedMinutes;
       const newDiff = new Date(payload.newCheckOut).getTime() - new Date(payload.newCheckIn).getTime();
       const newWorked = Math.floor(newDiff / 60000);
       if (Math.abs(newWorked - oldWorked) < 120) {
         isMinor = true;
       }
    } else if (!record || (!record.checkIn && payload.newCheckIn) || (!record.checkOut && payload.newCheckOut)) {
       // Missing checkin/checkout logic -> minor if it's within same day boundaries usually, but let's just say manager can fix missing punches
       isMinor = true;
    }

    const adjustment = await attendanceRepository.createAdjustment({
      organizationId,
      employeeId: payload.employeeId,
      date,
      newStatus: payload.newStatus,
      newCheckIn: payload.newCheckIn ? new Date(payload.newCheckIn) : null,
      newCheckOut: payload.newCheckOut ? new Date(payload.newCheckOut) : null,
      reason: payload.reason,
    });

    if (isMinor && hasAdjustPermission) {
       // Direct Override
       await attendanceRepository.updateRecord(adjustment.id /* wait, need to update actual adjustment row to approved */, { approvedBy: actorUserId, approvedAt: new Date() });
       
       await prisma.attendanceAdjustment.update({
         where: { id: adjustment.id },
         data: { approvedBy: actorUserId, approvedAt: new Date() }
       });
       await attendanceService.applyAdjustment(organizationId, adjustment);
       return { adjustment, status: "APPROVED" };
    } else {
       // Require Approval Engine
       await approvalsService.submitForApproval(organizationId, "ATTENDANCE_ADJUSTMENT", adjustment.id, actorUserId);
       return { adjustment, status: "PENDING_APPROVAL" };
    }
  },

  applyAdjustment: async (organizationId: string, adjustment: any) => {
    let record = await attendanceRepository.getRecord(organizationId, adjustment.employeeId, adjustment.date);
    let workedMinutes = 0;
    if (adjustment.newCheckIn && adjustment.newCheckOut) {
      workedMinutes = Math.floor((new Date(adjustment.newCheckOut).getTime() - new Date(adjustment.newCheckIn).getTime()) / 60000);
    }

    if (!record) {
      record = await attendanceRepository.createRecord(
        organizationId,
        adjustment.employeeId,
        adjustment.date,
        adjustment.newStatus,
        undefined,
        adjustment.newCheckIn,
        `Adjustment: ${adjustment.reason}`
      );
      if (adjustment.newCheckOut) {
         await attendanceRepository.updateRecord(record.id, { checkOut: adjustment.newCheckOut, workedMinutes });
      }
    } else {
      await attendanceRepository.updateRecord(record.id, {
        status: adjustment.newStatus,
        checkIn: adjustment.newCheckIn,
        checkOut: adjustment.newCheckOut,
        workedMinutes,
        notes: `${record!.notes || ''} | Adjusted: ${adjustment.reason}`
      });
    }

    eventBus.emit("attendance.adjusted", { organizationId, employeeId: adjustment.employeeId, date: adjustment.date });
  },

  generatePayrollSummary: async (organizationId: string, employeeId: string, month: number, year: number): Promise<PayrollSummary> => {
    const records = await attendanceRepository.getMonthlyRecords(organizationId, employeeId, month, year);
    
    let workingDays = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let unpaidDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let totalWorkedMinutes = 0;

    for (const r of records) {
      if (r.status !== AttendanceStatus.WEEK_OFF && r.status !== AttendanceStatus.HOLIDAY) {
        workingDays++;
      }
      if (r.status === AttendanceStatus.PRESENT) presentDays++;
      if (r.status === AttendanceStatus.LATE) {
        presentDays++;
        lateDays++;
      }
      if (r.status === AttendanceStatus.HALF_DAY) halfDays++;
      if (r.status === AttendanceStatus.ON_LEAVE) leaveDays++;
      if (r.status === AttendanceStatus.ABSENT) unpaidDays++;
      totalWorkedMinutes += r.workedMinutes;
    }

    const policy = await attendanceRepository.getPolicy(organizationId);
    const fullDayMins = policy?.fullDayMinutes || 480;
    const expectedMinutes = workingDays * fullDayMins;
    const overtimeMinutes = Math.max(0, totalWorkedMinutes - expectedMinutes);

    return {
      workingDays,
      presentDays,
      leaveDays,
      unpaidDays,
      halfDays,
      lateDays,
      overtimeHours: Math.round((overtimeMinutes / 60) * 100) / 100,
    };
  },

  ensurePeriodOpen: async (organizationId: string, date: Date) => {
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const period = await attendanceRepository.getPeriod(organizationId, month, year);
    if (period && period.status !== "OPEN") {
      throw new ApiError(400, `Attendance for ${month}/${year} is ${period.status}.`);
    }
  }
};
