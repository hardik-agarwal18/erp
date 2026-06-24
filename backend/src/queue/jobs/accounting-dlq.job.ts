import { Job } from "bullmq";
import { AccountingJobPayload } from "../types.js";
import logger from "../../config/logger.js";
import { prisma } from "../../config/database.js";
import { OutboxStatus } from "./accounting.job.js";

export const processAccountingDlqJob = async (job: Job<AccountingJobPayload>) => {
  const { outboxEventId } = job.data;
  
  logger.fatal({ outboxEventId, jobId: job.id }, "DLQ Processing: Accounting Poison Message Detected");
  
  const event = await (prisma as any).outboxEvent.findUnique({
    where: { id: outboxEventId }
  });

  if (event) {
    // Escalate to pager / alert system in real world
    logger.fatal({ 
      eventId: event.id, 
      aggregateType: event.aggregateType,
      lastError: event.lastError
    }, "Financial event permanently failed to process after max retries. MANUAL RECONCILIATION REQUIRED.");
  }
};
