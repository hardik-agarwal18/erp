import { Job } from "bullmq";
import { prisma } from "../../config/database.js";
import { OutboxStatus } from "./accounting.job.js";
import { QueueNames } from "../types.js";
import { accountingQueue } from "../queue.service.js";
import logger from "../../config/logger.js";

export const processOutboxRelayJob = async (job: Job) => {
  // Find pending or failed (due for retry) events
  const batchSize = 100;
  
  const events = await (prisma as any).outboxEvent.findMany({
    where: {
      OR: [
        { status: OutboxStatus.PENDING },
        { 
          status: OutboxStatus.FAILED, 
          nextRetryAt: { lte: new Date() } 
        }
      ]
    },
    take: batchSize,
    orderBy: { createdAt: "asc" }
  });

  if (events.length === 0) return { processedCount: 0 };

  logger.info({ count: events.length }, "Processing Outbox Events");

  let processedCount = 0;

  for (const event of events) {
    try {
      // Determine the target queue based on aggregate or event type
      // Currently routing everything that requires accounting to the accounting queue
      // Business domains like INVOICE_CREATED, PAYMENT_RECEIVED should route there
      
      const isAccountingEvent = [
        "SalesInvoiceIssued",
        "CustomerPaymentReceived",
        "GRNCreated",
        "VendorInvoiceApproved",
        "VendorPaymentCompleted",
        "PayrollRunCompleted",
        "PayrollPaid",
        "ExpenseApproved",
        "ExpensePaid",
        "CreditNoteIssued",
        "DebitNoteIssued"
      ].includes(event.eventType);

      if (isAccountingEvent) {
        await accountingQueue.add(event.eventType, {
          outboxEventId: event.id
        }, {
          jobId: `outbox-${event.id}` // Prevent double-queueing in BullMQ
        });
      }

      // Mark as ENQUEUED
      await (prisma as any).outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.ENQUEUED,
          processedAt: new Date()
        }
      });
      
      processedCount++;
    } catch (error: any) {
      logger.error({ error, eventId: event.id }, "Failed to relay outbox event");
      // Update error details but leave status as PENDING/FAILED so it retries
      // If it's already FAILED, it will retry again if nextRetryAt logic allows
      // Actually we'll leave it to be retried next time
    }
  }

  return { processedCount };
};

