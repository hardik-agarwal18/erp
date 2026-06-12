
import { z } from "zod";

export const applyForLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    leaveTypeId: z.string().uuid(),
    fromDate: z.string().datetime(),
    toDate: z.string().datetime(),
    totalDays: z.number().positive(),
    reason: z.string().min(5),
  }),
});
