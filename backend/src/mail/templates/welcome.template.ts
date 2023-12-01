import type {
  MailTemplateResult,
  WelcomeEmailTemplateParams,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

/**
 * Build welcome email content.
 */
export const welcomeEmailTemplate = (
  params: WelcomeEmailTemplateParams,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.recipientName);
  const organizationName = params.organizationName
    ? escapeHtml(params.organizationName)
    : "your workspace";
  const dashboardUrl = params.dashboardUrl
    ? escapeHtml(params.dashboardUrl)
    : "";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">Welcome to ${organizationName}</h2>
    <p style="margin:0 0 16px 0;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px 0;color:#374151;">
      Your account is ready. You can start managing your organization right away.
    </p>
    ${
      dashboardUrl
        ? `<p style="margin:0 0 24px 0;">
            <a href="${dashboardUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
              Open dashboard
            </a>
          </p>`
        : ""
    }
    <p style="margin:0;color:#6b7280;font-size:14px;">
      If you need help, reply to this email or contact support.
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.recipientName},`,
      "",
      `Welcome to ${params.organizationName ?? "your workspace"}.`,
      "Your account is ready. You can start managing your organization right away.",
      params.dashboardUrl ? `Open dashboard: ${params.dashboardUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
};
