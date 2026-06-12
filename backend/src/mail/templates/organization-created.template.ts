// @ts-nocheck
import type {
  MailTemplateResult,
  OrganizationCreatedTemplateParams,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

/**
 * Build organization created email content.
 */
export const organizationCreatedTemplate = (
  params: OrganizationCreatedTemplateParams,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.recipientName);
  const organizationName = escapeHtml(params.organizationName);
  const dashboardUrl = params.dashboardUrl
    ? escapeHtml(params.dashboardUrl)
    : "";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">Organization created</h2>
    <p style="margin:0 0 16px 0;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px 0;color:#374151;">
      Your organization <strong>${organizationName}</strong> is ready.
    </p>
    ${
      dashboardUrl
        ? `<p style="margin:0 0 24px 0;">
            <a href="${dashboardUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
              View organization
            </a>
          </p>`
        : ""
    }
    <p style="margin:0;color:#6b7280;font-size:14px;">
      If you did not create this organization, please contact support immediately.
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.recipientName},`,
      "",
      `Your organization ${params.organizationName} is ready.`,
      params.dashboardUrl ? `View organization: ${params.dashboardUrl}` : "",
      "",
      "If you did not create this organization, please contact support immediately.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
};
