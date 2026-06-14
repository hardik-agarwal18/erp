import { Job } from "bullmq";
import { prisma } from "../../config/database.js";
export enum OutboxStatus { PENDING="PENDING", PROCESSING="PROCESSING", COMPLETED="COMPLETED", FAILED="FAILED", ENQUEUED="ENQUEUED" }
import { AccountingJobPayload } from "../types.js";
import { accountingRepository } from "../../domains/financials/accounting/accounting.repository.js";
import { invoiceAccountingHandler } from "../../domains/financials/accounting/handlers/invoice.handler.js";
import { paymentAccountingHandler } from "../../domains/financials/accounting/handlers/payment.handler.js";
import { vendorInvoiceAccountingHandler } from "../../domains/financials/accounting/handlers/vendor-invoice.handler.js";
import { vendorPaymentAccountingHandler } from "../../domains/financials/accounting/handlers/vendor-payment.handler.js";
import { grnAccountingHandler } from "../../domains/financials/accounting/handlers/grn.handler.js";
import { accountingDlqQueue } from "../queue.service.js";
import logger from "../../config/logger.js";

const MAX_RETRIES = 5;
const BACKOFF_MS = 10000;

export const processAccountingJob = async (job: Job<AccountingJobPayload>) => {
  const { outboxEventId } = job.data;
  
  const event = await (prisma as any).outboxEvent.findUnique({
    where: { id: outboxEventId }
  });

  if (!event) {
    logger.warn({ outboxEventId }, "Outbox event not found, skipping");
    return;
  }

  if (event.status === OutboxStatus.COMPLETED) {
    logger.info({ outboxEventId }, "Outbox event already completed, skipping");
    return;
  }

  // Idempotency check removed because sourceEventId was removed

  try {
    await (prisma as any).outboxEvent.update({
      where: { id: event.id },
      data: { status: OutboxStatus.PROCESSING }
    });

    // Delegate to handlers based on eventType
    switch (event.eventType) {
      case "SalesInvoiceIssued":
        await invoiceAccountingHandler.handle(event.organizationId, event);
        break;
      case "CustomerPaymentReceived":
        await paymentAccountingHandler.handle(event.organizationId, event);
        break;
      case "VendorInvoiceApproved":
        await vendorInvoiceAccountingHandler.handle(event.organizationId, event);
        break;
      case "VendorPaymentCompleted":
        await vendorPaymentAccountingHandler.handle(event.organizationId, event);
        break;
      case "GoodsReceiptNoteReceived":
        await grnAccountingHandler.handle(event.organizationId, event);
        break;
      // Add other handlers here
      default:
        logger.warn({ eventType: event.eventType }, "No accounting handler configured for event type");
        break;
    }

    await markCompleted(event.id);
  } catch (error: any) {
    logger.error({ error, eventId: event.id }, "Failed to process accounting event");
    
    const newRetryCount = event.retryCount + 1;
    
    if (newRetryCount >= MAX_RETRIES) {
      logger.error({ eventId: event.id }, "Max retries exceeded. Pushing to DLQ.");
      await (prisma as any).outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.FAILED,
          lastError: error.message,
          retryCount: newRetryCount,
        }
      });
      
      await accountingDlqQueue.add("accounting-dlq-event", { outboxEventId: event.id }, {
        jobId: `dlq-${event.id}`
      });
    } else {
      await (prisma as any).outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.FAILED, // Leaves it for the relay to pick up again
          lastError: error.message,
          retryCount: newRetryCount,
          nextRetryAt: new Date(Date.now() + BACKOFF_MS * Math.pow(2, newRetryCount))
        }
      });
      // Throwing error allows BullMQ to also register the failure
      throw error;
    }
  }
};

async function markCompleted(id: string) {
  await (prisma as any).outboxEvent.update({
    where: { id },
    data: {
      status: OutboxStatus.COMPLETED,
      processedAt: new Date()
    }
  });
}


