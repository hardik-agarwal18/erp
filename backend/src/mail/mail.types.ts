
/**
 * Payload required to send a mail message through a provider.
 */
export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Normalized provider response for tracking.
 */
export interface MailSendResult {
  providerId?: string;
}

/**
 * Provider abstraction to support future email vendors.
 */
export interface MailProvider {
  send(options: SendMailOptions): Promise<MailSendResult>;
}

/**
 * Standard template render output.
 */
export interface MailTemplateResult {
  html: string;
  text: string;
}

/**
 * Verification email template inputs.
 */
export interface VerificationEmailTemplateParams {
  recipientName: string;
  verificationUrl: string;
  expiresInMinutes?: number;
}

/**
 * Password reset email template inputs.
 */
export interface PasswordResetEmailTemplateParams {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

/**
 * Invitation email template inputs.
 */
export interface InvitationEmailTemplateParams {
  organizationName: string;
  roleName: string;
  invitationUrl: string;
  expiresInHours?: number;
}

/**
 * Welcome email template inputs.
 */
export interface WelcomeEmailTemplateParams {
  recipientName: string;
  organizationName?: string;
  dashboardUrl?: string;
}

/**
 * Login alert email template inputs.
 */
export interface LoginAlertTemplateParams {
  recipientName: string;
  signInTime?: string;
  locationHint?: string;
  deviceHint?: string;
}

/**
 * Organization created email template inputs.
 */
export interface OrganizationCreatedTemplateParams {
  recipientName: string;
  organizationName: string;
  dashboardUrl?: string;
}

/**
 * Request payload for verification emails.
 */
export interface VerificationEmailRequest {
  to: string;
  name: string;
  verificationUrl: string;
  expiresInMinutes?: number;
}

/**
 * Request payload for password reset emails.
 */
export interface PasswordResetEmailRequest {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

/**
 * Request payload for invitation emails.
 */
export interface InvitationEmailRequest {
  to: string;
  organizationName: string;
  roleName: string;
  invitationUrl: string;
  expiresInHours?: number;
}

/**
 * Request payload for invoice emails.
 */
export interface InvoiceEmailRequest {
  to: string;
  invoiceNumber: string;
  customerName?: string;
  amountDue?: string;
  organizationName?: string;
  pdfBuffer?: Buffer;
  downloadUrl?: string;
}

/**
 * Request payload for export emails.
 */
export interface ExportEmailRequest {
  to: string;
  exportType: string;
  downloadUrl: string;
}

/**
 * Email rate limit result.
 */
export interface EmailRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Request payload for email change verification (OTP).
 */
export interface EmailChangeVerificationRequest {
  to: string;
  name: string;
  otp: string;
}
