
import { Job } from "bullmq";
import { MailJobPayload } from "../types.js";
import { DirectMailDispatcher } from "../../mail/mail.service.js";
import { defaultProvider, defaultProviderName } from "../../mail/mail.service.js"; // Needs to be exported
import logger from "../../config/logger.js";

export const processMailJob = async (job: Job<MailJobPayload>) => {
  logger.info({ jobId: job.id, type: job.data.type }, "Processing mail job");

  const dispatcher = new DirectMailDispatcher(defaultProvider, defaultProviderName);

  switch (job.data.type) {
    case "verification":
      await dispatcher.sendVerificationEmail(job.data.payload);
      break;
    case "password-reset":
      await dispatcher.sendPasswordResetEmail(job.data.payload);
      break;
    case "invitation":
      await dispatcher.sendInvitationEmail(job.data.payload);
      break;
    case "invoice":
      await dispatcher.sendInvoiceEmail(job.data.payload);
      break;
    case "export":
      await dispatcher.sendExportEmail(job.data.payload);
      break;
    case "email-change-current":
      await dispatcher.sendEmailChangeCurrentVerification(job.data.payload);
      break;
    case "email-change-new":
      await dispatcher.sendEmailChangeNewVerification(job.data.payload);
      break;
    default:
      throw new Error(`Unknown mail job type`);
  }

  logger.info({ jobId: job.id }, "Mail job processed successfully");
};
