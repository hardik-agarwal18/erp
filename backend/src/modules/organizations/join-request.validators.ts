import { z } from "zod";

export const createJoinRequestSchema = z.object({
  body: z.object({
    joinCode: z.string().min(1),
    message: z.string().max(500).optional(),
  }),
});

export const joinRequestIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    requestId: z.string().uuid(),
  }),
});
