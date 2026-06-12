// @ts-nocheck
import { z } from "zod";
import { ComponentCalculationType, WorkingDayBasis } from "@prisma/client";

export const createSalaryComponentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    calculationType: z.nativeEnum(ComponentCalculationType),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    isEarning: z.boolean(),
  }),
});

export const assignStructureSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    componentId: z.string().uuid(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    effectiveDate: z.string().datetime(),
  }),
});

export const generatePayrollSchema = z.object({
  body: z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2000),
  }),
});
