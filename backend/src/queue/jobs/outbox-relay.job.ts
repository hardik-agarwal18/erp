import { Job } from "bullmq";
import { prisma } from "../../config/database.js";
import { OutboxStatus } from "./accounting.job.js";
import { accountingQueue } from "../queue.service.js";
import { DomainEvents } from "../../shared/domain-events.js";
import logger from "../../config/logger.js";

/**
 * ACCOUNTING_EVENT_TYPES — the single, authoritative set of event types that are
 * routed to the accounting queue. All values are sourced from DomainEvents to
 * eliminate string-literal drift between producers and consumers.
 *
 * Fix history:
 *   2026-06-17  P0 — Replaced hardcoded strings with DomainEvents constants.
 *                    Prior literals were mismatched vs. producer values:
 *                      "SalesInvoiceIssued"    → DomainEvents.SALES_INVOICE_POSTED  ("SalesInvoicePOSTED")
 *                      "GRNCreated"            → DomainEvents.GRN_RECEIVED          ("GoodsReceiptNoteReceived")
 *                      "VendorInvoiceApproved" → DomainEvents.VENDOR_INVOICE_POSTED ("VendorInvoicePosted")
 *                      "VendorPaymentCompleted"→ DomainEvents.VENDOR_PAYMENT_CREATED("VendorPaymentCreated")
 *                      "PayrollRunCompleted"   → DomainEvents.PAYROLL_APPROVED      ("PayrollApproved")
 *                      "PayrollPaid"           → DomainEvents.PAYROLL_APPROVED      (duplicate alias removed)
 *   Orphan events that had no accounting handler and were silently swallowed:
 *                      "ExpenseApproved", "ExpensePaid", "CreditNoteIssued", "DebitNoteIssued"
 *                    These are removed from the routing set until handlers are implemented.
 */
const ACCOUNTING_EVENT_TYPES: ReadonlySet<string> = new Set([
  DomainEvents.SALES_INVOICE_POSTED,       // "SalesInvoicePOSTED"
  DomainEvents.CUSTOMER_PAYMENT_RECEIVED,  // "CustomerPaymentReceived"
  DomainEvents.GRN_RECEIVED,               // "GoodsReceiptNoteReceived"
  DomainEvents.VENDOR_INVOICE_POSTED,      // "VendorInvoicePosted"
  DomainEvents.VENDOR_PAYMENT_CREATED,     // "VendorPaymentCreated"
  DomainEvents.PAYROLL_APPROVED,           // "PayrollApproved"
  DomainEvents.STOCK_ADJUSTMENT_POSTED,    // "StockAdjustmentPosted"
]);

export const processOutboxRelayJob = async (job: Job) => {
  // Find pending or failed (due for retry) events
  const batchSize = 100;

  const events = await (prisma as any).outboxEvent.findMany({
    where: {
      OR: [
        { status: OutboxStatus.PENDING },
        {
          status: OutboxStatus.FAILED,
          nextRetryAt: { lte: new Date() },
        },
      ],
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  if (events.length === 0) return { processedCount: 0 };

  logger.info({ count: events.length }, "Processing Outbox Events");

  let processedCount = 0;

  for (const event of events) {
    try {
      if (ACCOUNTING_EVENT_TYPES.has(event.eventType)) {
        await accountingQueue.add(
          event.eventType,
          { outboxEventId: event.id },
          {
            jobId: `outbox-${event.id}`, // Prevent double-queueing in BullMQ
          }
        );

        // Mark as ENQUEUED only after successfully handing off to the queue
        await (prisma as any).outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.ENQUEUED,
            processedAt: new Date(),
          },
        });
      } else {
        // Event type has no handler. Log as a warning — do NOT silently mark ENQUEUED.
        // Leaving status as PENDING ensures the DLQ replay path can surface these.
        logger.warn(
          { eventId: event.id, eventType: event.eventType },
          "Outbox event type has no routing target — leaving PENDING for manual review"
        );
      }

      processedCount++;
    } catch (error: any) {
      logger.error({ error, eventId: event.id }, "Failed to relay outbox event");
      // Leave status as PENDING/FAILED so the next relay cycle retries it.
    }
  }

  return { processedCount };
};
