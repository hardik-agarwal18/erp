
import prisma from "../../../config/database.js";
import { CreateSalaryComponentInput, PayrollPolicyInput } from "./payroll.types.js";
import { PayrollRunStatus } from "@prisma/client";

export const payrollRepository = {
  createSalaryComponent: async (organizationId: string, payload: CreateSalaryComponentInput) => {
    return prisma.salaryComponent.create({
      data: {
        organizationId,
        ...payload,
      },
    });
  },

  listSalaryComponents: async (organizationId: string) => {
    return prisma.salaryComponent.findMany({
      where: { organizationId },
    });
  },

  getEmployeeStructure: async (organizationId: string, employeeId: string) => {
    return prisma.employeeSalaryStructure.findMany({
      where: {
        organizationId,
        employeeId,
      },
      include: {
        component: true,
      },
    });
  },

  upsertPayrollPolicy: async (organizationId: string, payload: PayrollPolicyInput) => {
    return prisma.payrollPolicy.upsert({
      where: { organizationId },
      update: payload,
      create: {
        organizationId,
        ...payload,
      },
    });
  },

  getPayrollPolicy: async (organizationId: string) => {
    return prisma.payrollPolicy.findUnique({
      where: { organizationId },
    });
  },

  createPayrollRun: async (organizationId: string, month: number, year: number) => {
    return prisma.payrollRun.create({
      data: {
        organizationId,
        month,
        year,
        status: PayrollRunStatus.DRAFT,
      },
    });
  },

  getPayrollRun: async (organizationId: string, id: string) => {
    return prisma.payrollRun.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        employees: true,
        payslips: {
          include: { lineItems: true },
        },
      },
    });
  },

  updatePayrollRunStatus: async (id: string, status: PayrollRunStatus, approvedBy?: string) => {
    return prisma.payrollRun.update({
      where: { id },
      data: { 
        status,
        ...(approvedBy ? { approvedBy, approvedAt: new Date() } : {})
      },
    });
  },
};
