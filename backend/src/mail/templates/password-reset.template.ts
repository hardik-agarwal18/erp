// @ts-nocheck
import type {
  MailTemplateResult,
  PasswordResetEmailTemplateParams,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

/**
 * Build password reset email content.
 */
export const passwordResetEmailTemplate = (
  params: PasswordResetEmailTemplateParams,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.recipientName);
  const resetUrl = escapeHtml(params.resetUrl);
  const expirationNotice = params.expiresInMinutes
    ? `This link expires in ${params.expiresInMinutes} minutes.`
    : "This link may expire soon.";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">Reset your password</h2>
    <p style="margin:0 0 16px 0;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px 0;color:#374151;">
      We received a request to reset your password. Use the button below to continue.
    </p>
    <p style="margin:0 0 24px 0;">
      <a href="${resetUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
        Reset password
      </a>
    </p>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">
      ${expirationNotice}
    </p>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      If the button does not work, paste this link into your browser: ${resetUrl}
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.recipientName},`,
      "",
      "We received a request to reset your password.",
      `Reset password: ${params.resetUrl}`,
      "",
      expirationNotice,
      "If you did not request a password reset, you can safely ignore this email.",
    ].join("\n"),
  };
};
