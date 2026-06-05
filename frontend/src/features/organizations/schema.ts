import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
});

export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;

export const transferOwnershipSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
});

export type TransferOwnershipSchema = z.infer<typeof transferOwnershipSchema>;
