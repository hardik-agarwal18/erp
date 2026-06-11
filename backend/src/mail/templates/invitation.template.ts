// @ts-nocheck
import type {
  InvitationEmailTemplateParams,
  MailTemplateResult,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";
/**
 * Build organization invitation email content.
 */
export const invitationEmailTemplate = (
  params: InvitationEmailTemplateParams,
): MailTemplateResult => {
  const organizationName = escapeHtml(params.organizationName);
  const roleName = escapeHtml(params.roleName);
  const invitationUrl = escapeHtml(params.invitationUrl);
  const expirationNotice = params.expiresInHours
    ? `This invitation expires in ${params.expiresInHours} hours.`
    : "This invitation may expire soon.";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">You're invited</h2>
    <p style="margin:0 0 16px 0;color:#374151;">
      You have been invited to join <strong>${organizationName}</strong> as
      <strong>${roleName}</strong>.
    </p>
    <p style="margin:0 0 24px 0;">
      <a href="${invitationUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
        Accept invitation
      </a>
    </p>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">
      ${expirationNotice}
    </p>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">
      If you were not expecting this invitation, you can safely ignore this email.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      If the button does not work, paste this link into your browser: ${invitationUrl}
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      "You're invited",
      "",
      `You have been invited to join ${params.organizationName} as ${params.roleName}.`,
      `Accept invitation: ${params.invitationUrl}`,
      "",
      expirationNotice,
      "If you were not expecting this invitation, you can safely ignore this email.",
    ].join("\n"),
  };
};
