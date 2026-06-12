
import { leavesRepository } from "./leaves.repository.js";
import { ApplyForLeaveInput } from "./leaves.types.js";
import ApiError from "../../../utils/ApiError.js";
import { LeaveStatus, AttendanceStatus } from "@prisma/client";
import { eventBus } from "../../../shared/events/event-bus.js";
import { approvalsService } from "../../core/approvals/approvals.service.js";
import prisma from "../../../config/database.js";

// Event Listeners for Leave Approvals
eventBus.on("approval.completed", async (event: any) => {
  if (event.entityType === "LEAVE_APPLICATION") {
    console.log(`[EventBus] leave-application ${event.entityId} approved`);
    await leavesService.approveLeave(event.organizationId, event.entityId);
  }
});

eventBus.on("approval.rejected", async (event: any) => {
  if (event.entityType === "LEAVE_APPLICATION") {
    console.log(`[EventBus] leave-application ${event.entityId} rejected`);
    await leavesRepository.updateApplicationStatus(event.entityId, LeaveStatus.REJECTED);
    eventBus.emit("leave.rejected", { organizationId: event.organizationId, applicationId: event.entityId });
  }
});

export const leavesService = {
  applyForLeave: async (organizationId: string, payload: ApplyForLeaveInput) => {
    const balance = await leavesRepository.getBalance(organizationId, payload.employeeId, payload.leaveTypeId);
    if (!balance || Number(balance.remaining) < payload.totalDays) {
      throw new ApiError(400, "Insufficient leave balance.");
    }

    const application = await leavesRepository.createApplication(organizationId, payload);
    return application;
  },

  submitForApproval: async (organizationId: string, id: string, userId: string) => {
    const application = await leavesRepository.getApplicationById(organizationId, id);
    if (!application) throw new ApiError(404, "Leave application not found");
    if (application.status !== LeaveStatus.DRAFT) {
      throw new ApiError(400, `Cannot submit leave application in ${application.status} status.`);
    }

    // Temporary hold on balance? Optional. We'll deduct on approval.
    await approvalsService.submitForApproval(organizationId, "LEAVE_APPLICATION", id, userId);

    const updated = await leavesRepository.updateApplicationStatus(id, LeaveStatus.PENDING_APPROVAL);
    return updated;
  },

  approveLeave: async (organizationId: string, applicationId: string) => {
    const application = await leavesRepository.getApplicationById(organizationId, applicationId);
    if (!application || application.status !== LeaveStatus.PENDING_APPROVAL) return;

    // Inside transaction to ensure balance and status update atomically
    await prisma.$transaction(async (tx: any) => {
      // Deduct balance
      await tx.leaveBalance.update({
        where: {
          organizationId_employeeId_leaveTypeId: {
            organizationId,
            employeeId: application.employeeId,
            leaveTypeId: application.leaveTypeId,
          },
        },
        data: {
          used: { increment: application.totalDays },
          remaining: { decrement: application.totalDays },
        },
      });

      // Update Application
      await tx.leaveApplication.update({
        where: { id: applicationId },
        data: { status: LeaveStatus.APPROVED },
      });

      // Mark future attendance records as ON_LEAVE
      // We iterate day by day and set AttendanceRecord
      let currentDate = new Date(application.fromDate);
      const endDate = new Date(application.toDate);

      while (currentDate <= endDate) {
        // Find existing record for this day
        const existingRecord = await tx.attendanceRecord.findFirst({
          where: {
            organizationId,
            employeeId: application.employeeId,
            date: currentDate,
          }
        });

        if (existingRecord) {
          await tx.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: { status: AttendanceStatus.ON_LEAVE }
          });
        } else {
          await tx.attendanceRecord.create({
            data: {
              organizationId,
              employeeId: application.employeeId,
              date: new Date(currentDate),
              status: AttendanceStatus.ON_LEAVE,
            }
          });
        }

        // Add 1 day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });

    eventBus.emit("leave.approved", { organizationId, applicationId });
  },

  getApplicationById: async (organizationId: string, id: string) => {
    return leavesRepository.getApplicationById(organizationId, id);
  },

  listApplications: async (organizationId: string, employeeId?: string) => {
    return leavesRepository.listApplications(organizationId, employeeId);
  },
};
