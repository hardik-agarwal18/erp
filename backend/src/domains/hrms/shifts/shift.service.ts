
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import { auditService } from "../../../services/audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../services/audit/audit.constants.js";
import { Prisma } from "@prisma/client";

function isNightShiftStr(startTime: string, endTime: string): boolean {
  return endTime < startTime;
}

export const shiftService = {
  async createShift(
    organizationId: string,
    actorUserId: string,
    data: any
  ) {
    const existing = await prisma.shift.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, "A shift with this name already exists");
    }

    const isNightShift = isNightShiftStr(data.startTime, data.endTime);

    const shift = await prisma.shift.create({
      data: {
        organizationId,
        name: data.name,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        lateGraceMinutes: data.lateGraceMinutes,
        earlyExitGraceMinutes: data.earlyExitGraceMinutes,
        minimumWorkMinutes: data.minimumWorkMinutes,
        weeklyOffDays: data.weeklyOffDays ?? null,
        isActive: data.isActive ?? true,
        isNightShift,
      },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: 'SHIFT_CREATED' as any,
      entityType: AUDIT_ENTITY_TYPES.SHIFT,
      entityId: shift.id,
      metadata: { name: shift.name },
    });

    return shift;
  },

  async updateShift(
    organizationId: string,
    shiftId: string,
    actorUserId: string,
    data: any
  ) {
    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new ApiError(404, "Shift not found");
    }

    if (data.name && data.name !== existing.name) {
      const nameTaken = await prisma.shift.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: data.name,
          },
        },
      });
      if (nameTaken) throw new ApiError(400, "Shift name already exists");
    }

    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    const isNightShift = isNightShiftStr(startTime, endTime);

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...data,
        isNightShift,
      },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: 'SHIFT_UPDATED' as any,
      entityType: AUDIT_ENTITY_TYPES.SHIFT,
      entityId: shiftId,
      metadata: { changes: "Updated fields" },
    });

    return updated;
  },

  async listShifts(organizationId: string, isActive?: boolean) {
    const where: any = { organizationId, deletedAt: null };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    return prisma.shift.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },

  async deleteShift(organizationId: string, shiftId: string, actorUserId: string) {
    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, organizationId, deletedAt: null },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, "Shift not found");
    }

    if (existing._count.assignments > 0) {
      // Soft delete if assignments exist to keep history intact
      await prisma.shift.update({
        where: { id: shiftId },
        data: { deletedAt: new Date(), isActive: false },
      });
    } else {
      await prisma.shift.delete({
        where: { id: shiftId },
      });
    }

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: 'SHIFT_DELETED' as any,
      entityType: AUDIT_ENTITY_TYPES.SHIFT,
      entityId: shiftId,
    });
  },

  // ----------------------------------------------------
  // Assignment Logic
  // ----------------------------------------------------

  async assignShift(
    organizationId: string,
    employeeId: string,
    shiftId: string,
    effectiveFromStr: string | Date,
    actorUserId: string
  ) {
    // 1. Validate employee and shift
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
    });
    if (!employee) throw new ApiError(404, "Employee not found");

    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, organizationId, deletedAt: null },
    });
    if (!shift) throw new ApiError(404, "Shift not found");

    // We standardize dates to midnight UTC to simplify comparisons
    const effectiveFrom = new Date(effectiveFromStr);
    effectiveFrom.setUTCHours(0, 0, 0, 0);

    // 2. Find all current and future assignments
    const assignments = await prisma.employeeShiftAssignment.findMany({
      where: { employeeId, organizationId },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (assignments.length > 0) {
      const latest = assignments[0];
      
      // If there's an assignment starting on or after the new one, reject
      if (latest.effectiveFrom.getTime() >= effectiveFrom.getTime()) {
        throw new ApiError(400, "Cannot assign shift because an overlapping or future assignment exists");
      }

      // Close the latest open assignment
      if (!latest.effectiveTo || latest.effectiveTo.getTime() >= effectiveFrom.getTime()) {
        const effectiveTo = new Date(effectiveFrom.getTime() - 24 * 60 * 60 * 1000); // previous day
        
        // If effectiveTo becomes before the previous effectiveFrom, that's an invalid state (it means they overlap fully).
        // The >= check above prevents this, but just to be safe:
        if (effectiveTo.getTime() < latest.effectiveFrom.getTime()) {
           throw new ApiError(400, "Overlapping shift assignments are not allowed");
        }

        await prisma.employeeShiftAssignment.update({
          where: { id: latest.id },
          data: { effectiveTo },
        });
      }
    }

    // 3. Create the new assignment
    const assignment = await prisma.employeeShiftAssignment.create({
      data: {
        organizationId,
        employeeId,
        shiftId,
        effectiveFrom,
      },
    });

    // 4. Audit
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: 'SHIFT_ASSIGNED' as any,
      entityType: AUDIT_ENTITY_TYPES.EMPLOYEE,
      entityId: employeeId,
      metadata: { shiftId, shiftName: shift.name, effectiveFrom },
    });

    return assignment;
  },

  async getEmployeeShifts(organizationId: string, employeeId: string) {
    return prisma.employeeShiftAssignment.findMany({
      where: { organizationId, employeeId },
      orderBy: { effectiveFrom: 'desc' },
      include: {
        shift: true,
      },
    });
  },
  
  async getDashboardMetrics(organizationId: string) {
    const totalShifts = await prisma.shift.count({
      where: { organizationId, deletedAt: null },
    });
    
    // We get current date for assignment checks
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const activeAssignments = await prisma.employeeShiftAssignment.findMany({
      where: {
        organizationId,
        effectiveFrom: { lte: today },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: today } }
        ]
      },
      include: { shift: true }
    });

    const totalEmployees = await prisma.employee.count({
      where: { organizationId, deletedAt: null, isActive: true },
    });

    const assignedCount = activeAssignments.length;
    const unassignedCount = Math.max(0, totalEmployees - assignedCount);

    const nightShiftCount = activeAssignments.filter((a: any) => a.shift.isNightShift).length;

    return {
      totalShifts,
      assignedCount,
      unassignedCount,
      nightShiftCount,
      totalEmployees
    };
  }
};
