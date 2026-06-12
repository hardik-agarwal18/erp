
import { payrollRepository } from "./payroll.repository.js";
import { CreateSalaryComponentInput, AssignStructureInput, GeneratePayrollInput } from "./payroll.types.js";
import { ComponentCalculationType, PayrollRunStatus, WorkingDayBasis } from "@prisma/client";
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import { attendanceService } from "../attendance/attendance.service.js";
import { approvalsService } from "../../core/approvals/approvals.service.js";
import { eventBus } from "../../../shared/events/event-bus.js";

// Event Listeners for Payroll Approvals
eventBus.on("approval.completed", async (event: any) => {
  if (event.entityType === "PAYROLL_RUN") {
    console.log(`[EventBus] payroll-run ${event.entityId} approved`);
    await payrollRepository.updatePayrollRunStatus(event.entityId, PayrollRunStatus.APPROVED, event.approvedBy);
    
    // Here we emit so Accounting can pick it up
    eventBus.emit("payroll.processed", { organizationId: event.organizationId, payrollRunId: event.entityId });
  }
});

eventBus.on("approval.rejected", async (event: any) => {
  if (event.entityType === "PAYROLL_RUN") {
    console.log(`[EventBus] payroll-run ${event.entityId} rejected`);
    await payrollRepository.updatePayrollRunStatus(event.entityId, PayrollRunStatus.CANCELLED);
  }
});

export const payrollService = {
  createSalaryComponent: async (organizationId: string, payload: CreateSalaryComponentInput) => {
    return payrollRepository.createSalaryComponent(organizationId, payload);
  },

  assignStructure: async (organizationId: string, payload: AssignStructureInput) => {
    return prisma.$transaction(async (tx) => {
      const structure = await tx.employeeSalaryStructure.upsert({
        where: {
          employeeId_componentId: {
            employeeId: payload.employeeId,
            componentId: payload.componentId,
          },
        },
        update: {
          amount: payload.amount,
          percentage: payload.percentage,
        },
        create: {
          organizationId,
          employeeId: payload.employeeId,
          componentId: payload.componentId,
          amount: payload.amount,
          percentage: payload.percentage,
        },
      });

      await tx.salaryStructureHistory.create({
        data: {
          organizationId,
          employeeId: payload.employeeId,
          componentId: payload.componentId,
          amount: payload.amount,
          percentage: payload.percentage,
          effectiveDate: new Date(payload.effectiveDate),
        },
      });

      return structure;
    });
  },

  generatePayrollRun: async (organizationId: string, payload: GeneratePayrollInput) => {
    // 1. Check if run already exists
    const existing = await prisma.payrollRun.findUnique({
      where: {
        organizationId_month_year: {
          organizationId,
          month: payload.month,
          year: payload.year,
        },
      },
    });

    if (existing) {
      if (existing.status !== PayrollRunStatus.DRAFT && existing.status !== PayrollRunStatus.CANCELLED) {
        throw new ApiError(400, `Payroll already generated for ${payload.month}/${payload.year} and is in ${existing.status}`);
      }
      // Delete existing draft to regenerate
      await prisma.payrollRun.delete({ where: { id: existing.id } });
    }

    const policy = await payrollRepository.getPayrollPolicy(organizationId);
    const employees = await prisma.employee.findMany({ where: { organizationId, deletedAt: null } });

    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          organizationId,
          month: payload.month,
          year: payload.year,
          status: PayrollRunStatus.DRAFT,
        },
      });

      let runGross = 0;
      let runDeds = 0;
      let runNet = 0;

      for (const emp of employees) {
        // Fetch Attendance Summary
        const attendanceSummary = await attendanceService.generatePayrollSummary(organizationId, emp.id, payload.month, payload.year);
        
        // Snapshot
        await tx.payrollRunEmployee.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.id,
            workingDays: attendanceSummary.workingDays,
            presentDays: attendanceSummary.presentDays,
            leaveDays: attendanceSummary.leaveDays,
            unpaidDays: attendanceSummary.unpaidDays,
            halfDays: attendanceSummary.halfDays,
            overtimeHours: attendanceSummary.overtimeHours,
            lateDays: attendanceSummary.lateDays,
          },
        });

        const structure = await tx.employeeSalaryStructure.findMany({
          where: { employeeId: emp.id },
          include: { component: true },
        });

        if (structure.length === 0) continue;

        let baseBasicForPercentage = 0;
        // First find basic to compute percentages
        for (const item of structure) {
          if (item.component.name.toUpperCase() === "BASIC") {
             baseBasicForPercentage = Number(item.amount || item.component.amount || 0);
             break;
          }
        }

        // Pro-ration multiplier
        let prorationFactor = 1.0;
        if (policy?.prorateByAttendance) {
           const workingDays = policy.workingDayBasis === WorkingDayBasis.WORKING_DAYS 
             ? attendanceSummary.workingDays 
             : new Date(payload.year, payload.month, 0).getDate(); // Calendar days
           
           if (workingDays > 0) {
             const payableDays = attendanceSummary.presentDays + attendanceSummary.leaveDays + (attendanceSummary.halfDays * 0.5);
             prorationFactor = payableDays / workingDays;
             if (prorationFactor > 1) prorationFactor = 1;
           }
        }

        let empGross = 0;
        let empDeds = 0;
        const lineItems = [];

        for (const item of structure) {
          let computedAmount = 0;
          if (item.component.calculationType === ComponentCalculationType.FLAT) {
             computedAmount = Number(item.amount || item.component.amount || 0);
          } else {
             const pct = Number(item.percentage || item.component.percentage || 0);
             computedAmount = baseBasicForPercentage * (pct / 100);
          }

          if (item.component.isEarning) {
             computedAmount = computedAmount * prorationFactor;
          }

          computedAmount = Math.round(computedAmount * 100) / 100;

          if (computedAmount > 0) {
            lineItems.push({
              componentName: item.component.name,
              isEarning: item.component.isEarning,
              amount: computedAmount,
            });

            if (item.component.isEarning) empGross += computedAmount;
            else empDeds += computedAmount;
          }
        }

        const empNet = empGross - empDeds;

        // Create Payslip
        if (empGross > 0 || empDeds > 0) {
          await tx.payslip.create({
            data: {
              organizationId,
              payrollRunId: run.id,
              employeeId: emp.id,
              grossPay: empGross,
              totalDeductions: empDeds,
              netPay: empNet,
              lineItems: {
                create: lineItems,
              },
            },
          });

          runGross += empGross;
          runDeds += empDeds;
          runNet += empNet;
        }
      }

      await tx.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGrossPay: runGross,
          totalDeductions: runDeds,
          totalNetPay: runNet,
        },
      });

      return tx.payrollRun.findUnique({ where: { id: run.id }});
    });
  },

  submitForApproval: async (organizationId: string, runId: string, userId: string) => {
    const run = await payrollRepository.getPayrollRun(organizationId, runId);
    if (!run) throw new ApiError(404, "Payroll Run not found");
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new ApiError(400, `Cannot submit from status ${run.status}`);
    }

    await approvalsService.submitForApproval(organizationId, "PAYROLL_RUN", runId, userId);
    await payrollRepository.updatePayrollRunStatus(runId, PayrollRunStatus.PENDING_APPROVAL);
  },
};
