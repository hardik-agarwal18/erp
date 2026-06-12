// @ts-nocheck
import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format

export const ShiftTypeEnum = z.enum([
  "GENERAL",
  "MORNING",
  "EVENING",
  "NIGHT",
  "ROTATIONAL"
]);

export const createShiftSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  type: ShiftTypeEnum.default("GENERAL"),
  startTime: z.string().regex(timePattern, "Start time must be in HH:mm format"),
  endTime: z.string().regex(timePattern, "End time must be in HH:mm format"),
  breakMinutes: z.number().int().min(0).default(0),
  lateGraceMinutes: z.number().int().min(0).default(0),
  earlyExitGraceMinutes: z.number().int().min(0).default(0),
  minimumWorkMinutes: z.number().int().min(0).optional().nullable(),
  weeklyOffDays: z.array(z.string()).optional().nullable(), // E.g. ["SATURDAY", "SUNDAY"]
  isActive: z.boolean().default(true),
});

export const updateShiftSchema = createShiftSchema.partial();

export const assignShiftSchema = z.object({
  shiftId: z.string().uuid(),
  effectiveFrom: z.coerce.date(),
});
