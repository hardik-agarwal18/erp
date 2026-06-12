
import { env } from "../config/env.js";
import { mailFrom } from "../config/mail.js";
import prisma from "../config/database.js";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";
import {
  MailLogStatus,
  MailProviderNames,
  MailRateLimits,
  MailSubjects,
} from "./mail.constants.js";
import { NodemailerProvider } from "./providers/nodemailer.provider.js";
import type {
  EmailRateLimitResult,
  EmailChangeVerificationRequest,
  ExportEmailRequest,
  InvitationEmailRequest,
  InvoiceEmailRequest,
  MailProvider,
  PasswordResetEmailRequest,
  SendMailOptions,
  VerificationEmailRequest,
} from "./mail.types.js";
import {
  invitationEmailTemplate,
  passwordResetEmailTemplate,
  verificationEmailTemplate,
  emailChangeCurrentTemplate,
  emailChangeNewTemplate,
  invoiceEmailTemplate,
} from "./templates/index.js";
import { transporter } from "../config/mail.js";

export const defaultProvider = new NodemailerProvider(transporter);
export const defaultProviderName = MailProviderNames.NODEMAILER;

type EmailLogPayload = {
  recipient: string;
  subject: string;
  status: (typeof MailLogStatus)[keyof typeof MailLogStatus];
  provider: string;
  providerId?: string;
  error?: string;
};

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

const assertValidUrl = (value: string, label: string): string => {
  try {
    return new URL(value).toString();
  } catch (error) {
    logger.error({ error }, "Invalid email URL");
    throw new ApiError(500, `${label} is misconfigured`);
  }
};

const logEmail = async (payload: EmailLogPayload): Promise<void> => {
  if (env.NODE_ENV === "test") {
    return;
  }

  try {
    await prisma.emailLog.create({
      data: {
        recipient: payload.recipient,
        subject: payload.subject,
        status: payload.status,
        provider: payload.provider,
        providerId: payload.providerId ?? null,
        error: payload.error ?? null,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to persist email log");
  }
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const applyRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): EmailRateLimitResult => {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: new Date(current.resetAt),
  };
};

/**
 * Enforce rate limits for verification emails.
 */
export const enforceVerificationEmailRateLimit = (
  recipient: string,
): EmailRateLimitResult =>
  applyRateLimit(
    `verification:${recipient}`,
    MailRateLimits.VERIFICATION_EMAIL.limit,
    MailRateLimits.VERIFICATION_EMAIL.windowMs,
  );

/**
 * Enforce rate limits for password reset emails.
 */
export const enforcePasswordResetEmailRateLimit = (
  recipient: string,
): EmailRateLimitResult =>
  applyRateLimit(
    `password-reset:${recipient}`,
    MailRateLimits.PASSWORD_RESET_EMAIL.limit,
    MailRateLimits.PASSWORD_RESET_EMAIL.windowMs,
  );

/**
 * Mail dispatcher contract for queue-ready architecture.
 */
export interface MailDispatcher {
  sendVerificationEmail(request: VerificationEmailRequest): Promise<void>;
  sendPasswordResetEmail(request: PasswordResetEmailRequest): Promise<void>;
  sendInvitationEmail(request: InvitationEmailRequest): Promise<void>;
  sendInvoiceEmail(request: InvoiceEmailRequest): Promise<void>;
  sendExportEmail(request: ExportEmailRequest): Promise<void>;
  sendEmailChangeCurrentVerification(request: EmailChangeVerificationRequest): Promise<void>;
  sendEmailChangeNewVerification(request: EmailChangeVerificationRequest): Promise<void>;
}

export class DirectMailDispatcher implements MailDispatcher {
  private readonly provider: MailProvider;
  private readonly providerName: string;

  constructor(provider: MailProvider, providerName: string) {
    this.provider = provider;
    this.providerName = providerName;
  }

  async sendInvoiceEmail(request: InvoiceEmailRequest): Promise<void> {
    const reqAny = request as any;
    const template = invoiceEmailTemplate({
      organizationName: reqAny.organizationName,
      invoiceNumber: reqAny.invoiceNumber,
      customerName: reqAny.customerName,
      amountDue: reqAny.amountDue,
    });

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: `Invoice ${request.invoiceNumber} from ${reqAny.organizationName}`,
        html: template.html,
        text: template.text,
        attachments: [
          {
            filename: `Invoice-${request.invoiceNumber}.pdf`,
            content: reqAny.pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      } as any,
      this.provider,
      this.providerName,
    );
  }

  async sendExportEmail(request: ExportEmailRequest): Promise<void> {
    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: `Your ${request.exportType} report export is ready`,
        html: `Your ${request.exportType} report has finished generating. <a href="${request.downloadUrl}">Download here</a>`,
        text: `Your ${request.exportType} report has finished generating. Download here: ${request.downloadUrl}`,
      },
      this.provider,
      this.providerName,
    );
  }

  async sendVerificationEmail(
    request: VerificationEmailRequest,
  ): Promise<void> {
    const template = verificationEmailTemplate({
      recipientName: request.name,
      verificationUrl: request.verificationUrl,
      expiresInMinutes: request.expiresInMinutes,
    });

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: MailSubjects.VERIFY_EMAIL,
        html: template.html,
        text: template.text,
      },
      this.provider,
      this.providerName,
    );
  }

  async sendPasswordResetEmail(
    request: PasswordResetEmailRequest,
  ): Promise<void> {
    const template = passwordResetEmailTemplate({
      recipientName: request.name,
      resetUrl: request.resetUrl,
      expiresInMinutes: request.expiresInMinutes,
    });

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: MailSubjects.PASSWORD_RESET,
        html: template.html,
        text: template.text,
      },
      this.provider,
      this.providerName,
    );
  }

  async sendInvitationEmail(request: InvitationEmailRequest): Promise<void> {
    const template = invitationEmailTemplate({
      organizationName: request.organizationName,
      roleName: request.roleName,
      invitationUrl: request.invitationUrl,
      expiresInHours: request.expiresInHours,
    });

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: MailSubjects.INVITATION(request.organizationName),
        html: template.html,
        text: template.text,
      },
      this.provider,
      this.providerName,
    );
  }

  async sendEmailChangeCurrentVerification(request: EmailChangeVerificationRequest): Promise<void> {
    const template = emailChangeCurrentTemplate(request);

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: "Security Alert: Email Change Requested",
        html: template.html,
        text: template.text,
      },
      this.provider,
      this.providerName,
    );
  }

  async sendEmailChangeNewVerification(request: EmailChangeVerificationRequest): Promise<void> {
    const template = emailChangeNewTemplate(request);

    await sendMail(
      {
        from: mailFrom,
        to: request.to,
        subject: "Verify your new email address",
        html: template.html,
        text: template.text,
      },
      this.provider,
      this.providerName,
    );
  }
}

import { mailQueue } from "../queue/queue.service.js";
import { randomUUID } from "crypto";

export class QueueMailDispatcher implements MailDispatcher {
  async sendVerificationEmail(request: VerificationEmailRequest): Promise<void> {
    await mailQueue.add(
      "send-verification",
      { type: "verification", payload: request },
      { jobId: `verification:${request.to}:${randomUUID()}` } // Idempotency key
    );
  }

  async sendPasswordResetEmail(request: PasswordResetEmailRequest): Promise<void> {
    await mailQueue.add(
      "send-password-reset",
      { type: "password-reset", payload: request },
      { jobId: `password-reset:${request.to}:${randomUUID()}` }
    );
  }

  async sendInvitationEmail(request: InvitationEmailRequest): Promise<void> {
    await mailQueue.add(
      "send-invitation",
      { type: "invitation", payload: request },
      { jobId: `invitation:${request.to}:${randomUUID()}` }
    );
  }

  async sendInvoiceEmail(request: InvoiceEmailRequest): Promise<void> {
    await mailQueue.add(
      "send-invoice",
      { type: "invoice", payload: request },
      { jobId: `invoice:${request.invoiceNumber}:${randomUUID()}` }
    );
  }

  async sendExportEmail(request: ExportEmailRequest): Promise<void> {
    await mailQueue.add(
      "send-export",
      { type: "export", payload: request },
      { jobId: `export:${request.exportType}:${randomUUID()}` }
    );
  }

  async sendEmailChangeCurrentVerification(request: EmailChangeVerificationRequest): Promise<void> {
    await mailQueue.add(
      "send-email-change-current",
      { type: "email-change-current", payload: request },
      { jobId: `email-change-current:${request.to}:${randomUUID()}` }
    );
  }

  async sendEmailChangeNewVerification(request: EmailChangeVerificationRequest): Promise<void> {
    await mailQueue.add(
      "send-email-change-new",
      { type: "email-change-new", payload: request },
      { jobId: `email-change-new:${request.to}:${randomUUID()}` }
    );
  }
}

let mailDispatcher: MailDispatcher = new QueueMailDispatcher();

/**
 * Override the active mail dispatcher (queue-ready architecture).
 */
export const setMailDispatcher = (dispatcher: MailDispatcher): void => {
  mailDispatcher = dispatcher;
};

/**
 * Send an email using the configured mail provider.
 */
export const sendMail = async (
  options: SendMailOptions,
  provider: MailProvider = defaultProvider,
  providerName: string = defaultProviderName,
): Promise<void> => {
  if (env.NODE_ENV === "test") {
    logger.debug(
      { to: options.to, subject: options.subject },
      "Email mocked in test",
    );
    return;
  }

  try {
    const result = await provider.send(options);
    logger.info(
      {
        messageId: result.providerId,
        to: options.to,
        subject: options.subject,
      },
      "Email sent",
    );

    await logEmail({
      recipient: options.to,
      subject: options.subject,
      status: MailLogStatus.SENT,
      provider: providerName,
      providerId: result.providerId,
    });
  } catch (error) {
    const errorMessage = formatError(error);
    logger.error({ error }, "Email send failed");
    await logEmail({
      recipient: options.to,
      subject: options.subject,
      status: MailLogStatus.FAILED,
      provider: providerName,
      error: errorMessage,
    });
    throw new ApiError(500, "Unable to send email at this time");
  }
};

/**
 * Send a verification email.
 *
 * @example
 * await sendVerificationEmail("user@acme.io", "Taylor", "https://app/acme/verify");
 */
export const sendVerificationEmail = async (
  to: string,
  name: string,
  url: string,
  expiresInMinutes?: number,
): Promise<void> => {
  if (env.NODE_ENV === "test") {
    await mailDispatcher.sendVerificationEmail({
      to,
      name,
      verificationUrl: assertValidUrl(url, "Verification URL"),
      expiresInMinutes,
    });
    return;
  }

  const rateLimit = enforceVerificationEmailRateLimit(to);
  if (!rateLimit.allowed) {
    logger.warn(
      { to, resetAt: rateLimit.resetAt },
      "Verification email limited",
    );
    throw new ApiError(
      429,
      "Too many verification emails sent. Try again later.",
    );
  }

  await mailDispatcher.sendVerificationEmail({
    to,
    name,
    verificationUrl: assertValidUrl(url, "Verification URL"),
    expiresInMinutes,
  });
};

/**
 * Send a password reset email.
 *
 * @example
 * await sendPasswordResetEmail("user@acme.io", "Taylor", "https://app/acme/reset");
 */
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  url: string,
  expiresInMinutes?: number,
): Promise<void> => {
  if (env.NODE_ENV === "test") {
    await mailDispatcher.sendPasswordResetEmail({
      to,
      name,
      resetUrl: assertValidUrl(url, "Password reset URL"),
      expiresInMinutes,
    });
    return;
  }

  const rateLimit = enforcePasswordResetEmailRateLimit(to);
  if (!rateLimit.allowed) {
    logger.warn(
      { to, resetAt: rateLimit.resetAt },
      "Password reset email limited",
    );
    throw new ApiError(
      429,
      "Too many password reset emails sent. Try again later.",
    );
  }

  await mailDispatcher.sendPasswordResetEmail({
    to,
    name,
    resetUrl: assertValidUrl(url, "Password reset URL"),
    expiresInMinutes,
  });
};

/**
 * Send an organization invitation email.
 *
 * @example
 * await sendInvitationEmail("user@acme.io", "Acme Corp", "Admin", "https://app/acme/invite");
 */
export const sendInvitationEmail = async (
  to: string,
  organizationName: string,
  roleName: string,
  url: string,
  expiresInHours?: number,
): Promise<void> =>
  mailDispatcher.sendInvitationEmail({
    to,
    organizationName,
    roleName,
    invitationUrl: assertValidUrl(url, "Invitation URL"),
    expiresInHours,
  });

export const sendEmailChangeCurrentVerification = async (
  to: string,
  name: string,
  otp: string,
): Promise<void> => {
  if (env.NODE_ENV === "test") {
    await mailDispatcher.sendEmailChangeCurrentVerification({ to, name, otp });
    return;
  }
  await mailDispatcher.sendEmailChangeCurrentVerification({ to, name, otp });
};

export const sendEmailChangeNewVerification = async (
  to: string,
  name: string,
  otp: string,
): Promise<void> => {
  if (env.NODE_ENV === "test") {
    await mailDispatcher.sendEmailChangeNewVerification({ to, name, otp });
    return;
  }
  await mailDispatcher.sendEmailChangeNewVerification({ to, name, otp });
};
