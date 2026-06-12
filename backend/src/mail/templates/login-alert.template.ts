
import type {
  LoginAlertTemplateParams,
  MailTemplateResult,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

/**
 * Build login alert email content.
 */
export const loginAlertTemplate = (
  params: LoginAlertTemplateParams,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.recipientName);
  const signInTime = params.signInTime
    ? escapeHtml(params.signInTime)
    : "recently";
  const locationHint = params.locationHint
    ? escapeHtml(params.locationHint)
    : "an unknown location";
  const deviceHint = params.deviceHint
    ? escapeHtml(params.deviceHint)
    : "a new device";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">New login detected</h2>
    <p style="margin:0 0 16px 0;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px 0;color:#374151;">
      We noticed a login from ${deviceHint} in ${locationHint} at ${signInTime}.
    </p>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">
      If this was you, no action is required. If not, please reset your password immediately.
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.recipientName},`,
      "",
      `We noticed a login from ${params.deviceHint ?? "a new device"} in ${
        params.locationHint ?? "an unknown location"
      } at ${params.signInTime ?? "recently"}.`,
      "If this was you, no action is required. If not, please reset your password immediately.",
    ].join("\n"),
  };
};
