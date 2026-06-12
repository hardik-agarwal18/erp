
import type {
  InvitationEmailRequest,
  PasswordResetEmailRequest,
  VerificationEmailRequest,
  InvoiceEmailRequest,
} from "../mail/mail.types.js";

// Queues definitions
export enum QueueNames {
  MAIL = "mail-queue",
  REPORTS = "reports-queue",
  AUDIT_EXPORTS = "audit-exports-queue",
  NOTIFICATIONS = "notifications-queue",
  PDF_GENERATION = "pdf-generation-queue",
  STORAGE_CLEANUP = "storage-cleanup-queue",
}

// Mail Job payloads
export type MailJobPayload =
  | { type: "verification"; payload: VerificationEmailRequest }
  | { type: "password-reset"; payload: PasswordResetEmailRequest }
  | { type: "invitation"; payload: InvitationEmailRequest }
  | { type: "invoice"; payload: InvoiceEmailRequest }
  | { type: "export"; payload: import("../mail/mail.types.js").ExportEmailRequest }
  | { type: "email-change-current"; payload: import("../mail/mail.types.js").EmailChangeVerificationRequest }
  | { type: "email-change-new"; payload: import("../mail/mail.types.js").EmailChangeVerificationRequest };

// Future jobs

export type NotificationJobPayload = {
  userId: string;
  message: string;
};

export type PdfGenerationJobPayload = {
  documentId: string;
  documentType: "INVOICE" | "PURCHASE_ORDER";
  organizationId: string;
};

export type ReportJobPayload = {
  organizationId: string;
  reportType: string;
  userId: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  filters?: Record<string, unknown>;
};

export type AuditExportJobPayload = {
  organizationId: string;
  userId: string;
  startDate?: string;
  endDate?: string;
};
