
import type { MailTemplateResult, EmailChangeVerificationRequest } from "../mail.types.js";
import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

export const emailChangeNewTemplate = (
  params: EmailChangeVerificationRequest,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.name);
  const otp = escapeHtml(params.otp);

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">Verify your new email address</h2>

    <p style="margin:0 0 16px 0;color:#374151;">
      Hi ${recipientName},
    </p>

    <p style="margin:0 0 16px 0;color:#374151;">
      Please use the following verification code to confirm your new email address.
    </p>

    <div style="margin:0 0 24px 0;padding:16px;background-color:#f3f4f6;border-radius:6px;text-align:center;">
      <span style="font-size:24px;font-weight:bold;letter-spacing:4px;color:#111827;">${otp}</span>
    </div>

    <p style="margin:0 0 16px 0;color:#374151;">
      This code will expire in 10 minutes.
    </p>

    <p style="margin:0;color:#6b7280;font-size:14px;">
      If you did not initiate this change, you can safely ignore this email.
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.name},`,
      "",
      "Please use the following verification code to confirm your new email address.",
      `Your verification code is: ${params.otp}`,
      "",
      "This code will expire in 10 minutes.",
      "",
      "If you did not initiate this change, you can safely ignore this email.",
    ].join("\n"),
  };
};
