// @ts-nocheck
import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);
const csrfHeaderSchema = z.object({
  "x-csrf-token": z.string().min(1),
}).passthrough();

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const signupSchema = registerSchema;

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const switchWorkspaceSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid(),
  }),
});

export const refreshTokenSchema = z.object({
  headers: csrfHeaderSchema,
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: passwordSchema,
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(10),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: emailSchema,
  }),
});

export const requestEmailChangeSchema = z.object({
  body: z.object({
    newEmail: emailSchema,
  }),
});

export const verifyEmailChangeSchema = z.object({
  body: z.object({
    currentEmailOtp: z.string().length(6),
    newEmailOtp: z.string().length(6),
  }),
});
