
import { z } from "zod";

export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    name: z.string().min(2).max(120).optional(),
    password: z.string().min(8).max(128).optional(),
  }),
});
