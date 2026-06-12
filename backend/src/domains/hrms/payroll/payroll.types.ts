// @ts-nocheck
import { ComponentCalculationType, WorkingDayBasis } from "@prisma/client";

export interface CreateSalaryComponentInput {
  name: string;
  calculationType: ComponentCalculationType;
  amount?: number;
  percentage?: number;
  isEarning: boolean;
}

export interface AssignStructureInput {
  employeeId: string;
  componentId: string;
  amount?: number;
  percentage?: number;
  effectiveDate: Date | string;
}

export interface PayrollPolicyInput {
  prorateByAttendance: boolean;
  workingDayBasis: WorkingDayBasis;
}

export interface GeneratePayrollInput {
  month: number;
  year: number;
}
