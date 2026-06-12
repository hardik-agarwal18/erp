
import { z } from "zod";
import { ApproverType } from "@prisma/client";

export const createApprovalTemplateSchema = z.object({
  body: z.object({
    entityType: z.string().min(1, "Entity type is required"),
    name: z.string().min(1, "Name is required"),
    steps: z.array(
      z.object({
        order: z.number().int().positive(),
        approverType: z.nativeEnum(ApproverType),
        roleId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        escalationAfterHours: z.number().int().positive().optional(),
        autoApprove: z.boolean().optional(),
      })
    ).min(1, "At least one step is required"),
  }),
});

export const actionApprovalSchema = z.object({
  body: z.object({
    comments: z.string().optional(),
  }),
});
