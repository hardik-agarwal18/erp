
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

export const checkInSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    time: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const checkOutSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    time: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const requestAdjustmentSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    date: z.string().datetime(),
    newStatus: z.nativeEnum(AttendanceStatus),
    newCheckIn: z.string().datetime().optional(),
    newCheckOut: z.string().datetime().optional(),
    reason: z.string().min(5),
  }),
});
