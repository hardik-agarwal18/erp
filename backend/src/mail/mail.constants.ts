/**
 * Centralized email subjects for transactional messages.
 */
export const MailSubjects = {
  VERIFY_EMAIL: "Verify your email address",
  PASSWORD_RESET: "Reset your password",
  INVITATION: (organizationName: string) =>
    `Invitation to join ${organizationName}`,
  WELCOME: "Welcome",
  LOGIN_ALERT: "New login detected",
  ORGANIZATION_CREATED: (organizationName: string) =>
    `Your organization ${organizationName} is ready`,
} as const;

/**
 * Supported mail provider identifiers.
 */
export const MailProviderNames = {
  NODEMAILER: "nodemailer",
} as const;

/**
 * Email log status values.
 */
export const MailLogStatus = {
  SENT: "sent",
  FAILED: "failed",
} as const;

/**
 * In-memory rate limit defaults. Designed for Redis-backed replacement.
 */
export const MailRateLimits = {
  VERIFICATION_EMAIL: {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  },
  PASSWORD_RESET_EMAIL: {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  },
} as const;
