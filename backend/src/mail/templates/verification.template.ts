
import type {
  MailTemplateResult,
  VerificationEmailTemplateParams,
} from "../mail.types.js";

import { escapeHtml } from "../helpers/escape-html.js";
import { buildBaseTemplate } from "../helpers/base-template.js";

export const verificationEmailTemplate = (
  params: VerificationEmailTemplateParams,
): MailTemplateResult => {
  const recipientName = escapeHtml(params.recipientName);
  const verificationUrl = escapeHtml(params.verificationUrl);

  const expirationNotice = params.expiresInMinutes
    ? `This link expires in ${params.expiresInMinutes} minutes.`
    : "This link may expire soon.";

  const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;">Verify your email</h2>

    <p style="margin:0 0 16px 0;color:#374151;">
      Hi ${recipientName},
    </p>

    <p style="margin:0 0 16px 0;color:#374151;">
      Please verify your email address by clicking the button below.
    </p>

    <p style="margin:0 0 24px 0;">
      <a href="${verificationUrl}"
         style="background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
        Verify Email
      </a>
    </p>

    <p style="margin:0;color:#6b7280;font-size:14px;">
      ${expirationNotice}
    </p>
  `;

  return {
    html: buildBaseTemplate(content),
    text: [
      `Hi ${params.recipientName},`,
      "",
      "Please verify your email address.",
      `Verification link: ${params.verificationUrl}`,
      "",
      expirationNotice,
    ].join("\n"),
  };
};
