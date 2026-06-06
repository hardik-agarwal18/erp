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

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(120, "Company name must not exceed 120 characters"),
  legalName: z.string().max(200, "Legal name must not exceed 200 characters").optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code (e.g., USD)"),
  timezone: z.string().refine((val) => {
    try {
      return Intl.supportedValuesOf("timeZone").includes(val);
    } catch (e) {
      return false;
    }
  }, "Invalid timezone"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
});

export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
