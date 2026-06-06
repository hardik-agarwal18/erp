import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(255).optional(),
    permissionNames: z.array(z.string().min(3)).min(1),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(255).optional(),
    permissionNames: z.array(z.string().min(3)).min(1).optional(),
  }),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
