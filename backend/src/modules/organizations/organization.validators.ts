import { z } from "zod";

const settingsSchema = z.record(z.string(), z.unknown());

export const organizationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const organizationMemberParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    memberId: z.string().uuid(),
  }),
});

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(120).optional(),
    logo: z.string().url().optional(),
    settings: settingsSchema.optional(),
    invites: z.array(z.string().email()).optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(120).optional(),
    logo: z.string().url().nullable().optional(),
    settings: settingsSchema.optional(),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      email: z.string().email(),
      roleId: z.string().uuid().optional(),
      roleName: z.string().min(2).max(80).optional(),
    })
    .refine((value) => Boolean(value.roleId || value.roleName), {
      message: "roleId or roleName is required",
      path: ["roleId"],
    }),
});

export const updateMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    memberId: z.string().uuid(),
  }),
  body: z.object({
    roleId: z.string().uuid(),
  }),
});

export const transferOwnershipSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    memberId: z.string().uuid(),
  }),
});
