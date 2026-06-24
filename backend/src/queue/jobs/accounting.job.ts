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
import { payrollAccountingHandler } from "../../domains/financials/accounting/handlers/payroll.handler.js";
import { stockAdjustmentAccountingHandler } from "../../domains/financials/accounting/handlers/stock-adjustment.handler.js";
import { DomainEvents } from "../../shared/domain-events.js";
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
      case DomainEvents.SALES_INVOICE_POSTED:
        await invoiceAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.CUSTOMER_PAYMENT_RECEIVED:
        await paymentAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.VENDOR_INVOICE_POSTED:
        await vendorInvoiceAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.VENDOR_PAYMENT_CREATED:
        await vendorPaymentAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.GRN_RECEIVED:
        await grnAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.PAYROLL_APPROVED:
        await payrollAccountingHandler.handle(event.organizationId, event);
        break;
      case DomainEvents.STOCK_ADJUSTMENT_POSTED:
        await stockAdjustmentAccountingHandler.handle(event.organizationId, event);
        break;
      // Add other handlers here
      default:
        logger.warn({ eventType: event.eventType }, "No accounting handler configured for event type");
        break;
    }

    await markCompleted(event.id);
  } catch (error: any) {
    logger.error({ error, eventId: event.id }, "Failed to process accounting event");
    
    if (error.code === "P2002") {
      // Unique constraint failed - means another worker processed this or it's a duplicate retry.
      logger.info({ eventId: event.id }, "Event was already processed (Unique Constraint). Marking completed.");
      await markCompleted(event.id);
      return;
    }

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


