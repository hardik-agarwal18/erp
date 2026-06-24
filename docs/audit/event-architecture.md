# Event Architecture Audit
**Audit Phase 4 — Event Flow, Outbox Pattern, Consumer Coverage**
*Generated: 2026-06-17 | Auditor: Platform Reliability Engineer Review*

---

## Executive Summary

The system implements the **Transactional Outbox Pattern** correctly at the infrastructure level: business events are written to an `OutboxEvent` table within the same Prisma transaction as the business operation, then relayed to BullMQ via a polling worker, and dispatched to domain-specific accounting handlers. However, there are **critical naming inconsistencies** between producers and consumers, missing handlers for several declared events, and a dual-bus architecture (Outbox + in-process `EventEmitter`) that creates confusion about which bus to use for which purpose.

---

## 1. Event Infrastructure Overview

### Architecture Pattern: Transactional Outbox → BullMQ → Domain Handlers

```
Producer (Service)
  ↓ (same DB transaction)
OutboxEvent table (PostgreSQL)
  ↓ (polling every N seconds)
outbox-relay.job.ts  [OUTBOX_RELAY worker]
  ↓ (BullMQ enqueue)
accounting queue [ACCOUNTING worker]
  ↓ (dispatch by eventType)
Domain Handler (invoice/payment/grn/etc.)
  ↓
JournalEntry (PostgreSQL)
  ↓ (mark)
OutboxEvent.status = COMPLETED
```

### Parallel Pattern: In-Process EventEmitter

```
Service (e.g. product.update)
  ↓
eventBus.emit("product.updated", payload)
  ↓
CacheService.deletePattern(...)   [cache invalidation only]
```

**Assessment:** The dual-bus pattern is intentional and appropriate — the Outbox is for durable financial events requiring guaranteed delivery; the `EventEmitter` is for ephemeral cache invalidation. This is a sound architecture. However, it must be documented clearly to prevent future developers from using the wrong bus.

---

## 2. Domain Events Registry

**Source of truth file:** `src/shared/domain-events.ts`

```typescript
export const DomainEvents = {
  // Sales & Revenue
  SALES_INVOICE_POSTED:       "SalesInvoicePOSTED",
  CUSTOMER_PAYMENT_RECEIVED:  "CustomerPaymentReceived",

  // Procurement & Payables
  VENDOR_INVOICE_POSTED:      "VendorInvoicePosted",
  VENDOR_PAYMENT_CREATED:     "VendorPaymentCreated",

  // Inventory
  GRN_RECEIVED:               "GoodsReceiptNoteReceived",
  STOCK_ADJUSTMENT_POSTED:    "StockAdjustmentPosted",

  // HRMS & Payroll
  PAYROLL_APPROVED:           "PayrollApproved",

  // IAM
  USER_REGISTERED:            "UserRegistered",
  USER_LOGIN:                 "UserLogin",
}
```

---

## 3. Critical: Event Name Drift (Producer ≠ Consumer)

### Finding 1: SALES_INVOICE_POSTED Has Inconsistent Naming

**Producer (invoice.service.ts line 202):**
```typescript
eventType: "SalesInvoicePOSTED"  ← mixed case "POSTED"
```

**Consumer (accounting.job.ts line 47):**
```typescript
case DomainEvents.SALES_INVOICE_POSTED:  // resolves to "SalesInvoicePOSTED"
```

**Outbox-relay routing list (outbox-relay.job.ts line 39):**
```typescript
const isAccountingEvent = [
  "SalesInvoiceIssued",            ← "Issued" NOT "POSTED"
  "CustomerPaymentReceived",
  ...
].includes(event.eventType);
```

**CRITICAL BUG:** The outbox relay routes events with `eventType === "SalesInvoiceIssued"` but the producer emits `"SalesInvoicePOSTED"`. **Sales invoice accounting events are NEVER relayed to the accounting queue.** They remain in PENDING status in the OutboxEvent table forever.

**Evidence chain:**
1. Producer: `invoice.service.ts:202` emits `"SalesInvoicePOSTED"`
2. Relay filter: `outbox-relay.job.ts:39` looks for `"SalesInvoiceIssued"`
3. Mismatch → event never enqueued → journal entry never created

**Impact:** Every posted sales invoice has NO journal entry created. The AR, Revenue, and Tax accounts are never updated by the outbox pipeline.

**Recommendation:** Change `outbox-relay.job.ts` line 39 from `"SalesInvoiceIssued"` to `"SalesInvoicePOSTED"` **immediately**.

---

## 4. Complete Event Matrix

| Event Name | DomainEvents Key | Producer | Relay Routes? | Handler | Status |
|---|---|---|---|---|---|
| `SalesInvoicePOSTED` | `SALES_INVOICE_POSTED` | `invoice.service.ts:202` | ❌ (relay looks for `SalesInvoiceIssued`) | `invoice.handler.ts` | **BROKEN** |
| `CustomerPaymentReceived` | `CUSTOMER_PAYMENT_RECEIVED` | INFERRED (payment.service) | ✅ | `payment.handler.ts` | Likely working |
| `VendorInvoicePosted` | `VENDOR_INVOICE_POSTED` | INFERRED (vendor-invoice.service) | ✅ | `vendor-invoice.handler.ts` | Likely working |
| `VendorPaymentCreated` | `VENDOR_PAYMENT_CREATED` | INFERRED (vendor-payment.service) | ✅ | `vendor-payment.handler.ts` | Likely working |
| `GoodsReceiptNoteReceived` | `GRN_RECEIVED` | INFERRED (grn.service) | ✅ (`GRNCreated`) | `grn.handler.ts` | **DRIFT** — relay uses `GRNCreated`, handler uses `GoodsReceiptNoteReceived` |
| `StockAdjustmentPosted` | `STOCK_ADJUSTMENT_POSTED` | INFERRED | ✅ | `stock-adjustment.handler.ts` | INFERRED working |
| `PayrollApproved` | `PAYROLL_APPROVED` | INFERRED (payroll.service) | ✅ (`PayrollRunCompleted`, `PayrollPaid`) | `payroll.handler.ts` | **DRIFT** — relay uses different names |
| `ExpenseApproved` | N/A (NOT in DomainEvents) | INFERRED | ✅ (relay has `ExpenseApproved`) | No handler in switch | **DEAD EVENT** |
| `ExpensePaid` | N/A | INFERRED | ✅ (relay has `ExpensePaid`) | No handler in switch | **DEAD EVENT** |
| `CreditNoteIssued` | N/A | INFERRED | ✅ (relay has `CreditNoteIssued`) | No handler in switch | **DEAD EVENT** |
| `DebitNoteIssued` | N/A | INFERRED | ✅ (relay has `DebitNoteIssued`) | No handler in switch | **DEAD EVENT** |
| `UserRegistered` | `USER_REGISTERED` | INFERRED | ❌ | None | Not accounting-related (OK) |
| `UserLogin` | `USER_LOGIN` | INFERRED | ❌ | None | Not accounting-related (OK) |

**Relay routing list vs DomainEvents constants comparison:**

| In Relay Routing | In DomainEvents | Match? |
|---|---|---|
| `SalesInvoiceIssued` | `SalesInvoicePOSTED` | ❌ MISMATCH |
| `CustomerPaymentReceived` | `CustomerPaymentReceived` | ✅ |
| `GRNCreated` | `GoodsReceiptNoteReceived` | ❌ MISMATCH |
| `VendorInvoiceApproved` | `VendorInvoicePosted` | ❌ MISMATCH |
| `PayrollRunCompleted` | `PayrollApproved` | ❌ MISMATCH |
| `PayrollPaid` | `PayrollApproved` | ❌ MISMATCH |
| `ExpenseApproved` | (not defined) | ❌ ORPHAN |
| `ExpensePaid` | (not defined) | ❌ ORPHAN |
| `CreditNoteIssued` | (not defined) | ❌ ORPHAN |
| `DebitNoteIssued` | (not defined) | ❌ ORPHAN |

---

## 5. Outbox Relay Analysis

**File:** `src/queue/jobs/outbox-relay.job.ts`

```typescript
// lines 12-24
const events = await prisma.outboxEvent.findMany({
  where: {
    OR: [
      { status: OutboxStatus.PENDING },
      { status: OutboxStatus.FAILED, nextRetryAt: { lte: new Date() } }
    ]
  },
  take: batchSize,   // batchSize = 100
  orderBy: { createdAt: "asc" }
});
```

**Finding 2: Events Not Matching Accounting Routing Are Silently Dropped**
```typescript
// lines 52-58
if (isAccountingEvent) {
  await accountingQueue.add(event.eventType, { outboxEventId: event.id }, {
    jobId: `outbox-${event.id}` // Prevent double-queueing
  });
}
// If NOT isAccountingEvent → falls through without error
// Then ENQUEUED status is set regardless
await outboxEvent.update({ status: OutboxStatus.ENQUEUED, processedAt: new Date() });
```

**Impact:** Events that don't match the hardcoded accounting routing list are marked `ENQUEUED` and then `processedAt` is set — they appear processed but are never actually consumed. This is a silent data loss pattern.

**Recommendation:** Route non-accounting events to their appropriate queues, or log a warning and explicitly mark events as `SKIPPED` with reason.

---

## 6. Accounting Job Handler Analysis

**File:** `src/queue/jobs/accounting.job.ts`

**Finding 3: Missing Handlers for Routed Events**
```typescript
switch (event.eventType) {
  case DomainEvents.SALES_INVOICE_POSTED:    // handler exists
  case DomainEvents.CUSTOMER_PAYMENT_RECEIVED: // handler exists
  case DomainEvents.VENDOR_INVOICE_POSTED:    // handler exists
  case DomainEvents.VENDOR_PAYMENT_CREATED:   // handler exists
  case DomainEvents.GRN_RECEIVED:             // handler exists
  case DomainEvents.PAYROLL_APPROVED:         // handler exists
  case DomainEvents.STOCK_ADJUSTMENT_POSTED:  // handler exists
  default:
    logger.warn({ eventType: event.eventType }, "No accounting handler configured");
    break;  // ← silently succeeds, event marked COMPLETED with no journal entry
}
```

**Impact:** Events for `ExpenseApproved`, `CreditNoteIssued`, `DebitNoteIssued` (which the relay routes to accounting) will match the `default` case, log a warning, and be marked COMPLETED without creating any journal entries. Expense accounting is completely non-functional.

---

## 7. DLQ Implementation

**File:** `src/queue/jobs/accounting-dlq.job.ts` (870 bytes)

**Finding 4: DLQ Handler Contents Unknown**
The DLQ job file is 870 bytes. Its contents were not fully inspected but the worker registration shows:
```typescript
// worker.service.ts line 108
const accountingDlqWorker = new Worker(QueueNames.ACCOUNTING_DLQ, 
  withLoggerContext(processAccountingDlqJob), 
  { connection: queueConnection.duplicate(), concurrency: 1 });
```

**INFERRED:** The DLQ worker likely alerts or logs failed events for manual review. DLQ replay capability is **UNVERIFIED**.

---

## 8. Retry & Backoff Strategy

**Evidence:**
```typescript
// accounting.job.ts lines 85-113
const newRetryCount = event.retryCount + 1;
if (newRetryCount >= MAX_RETRIES) {  // MAX_RETRIES = 5
  // Push to DLQ
} else {
  data: {
    nextRetryAt: new Date(Date.now() + BACKOFF_MS * Math.pow(2, newRetryCount))
    // BACKOFF_MS = 10000, exponential backoff
  }
}
```

**Assessment:** Exponential backoff (10s, 20s, 40s, 80s, 160s) with max 5 retries before DLQ. This is a sound strategy. However, after DLQ push, there is no observed automatic DLQ replay capability — manual intervention is required.

---

## 9. In-Process Event Bus (EventEmitter)

**File:** `src/shared/events/event-bus.ts`

**What it handles (cache invalidation only):**
```typescript
eventBus.on("product.updated", ...)     → invalidate PRODUCTS cache
eventBus.on("inventory.adjusted", ...) → invalidate INVENTORY + DASHBOARD cache
eventBus.on("customer.updated", ...)   → invalidate CUSTOMERS cache
eventBus.on("vendor.updated", ...)     → invalidate VENDORS cache
eventBus.on("role.updated", ...)       → invalidate ROLES cache
```

**Also handles treasury and approval events:**
```typescript
// Various treasury account/transfer events
// Approval completed/rejected events
```

**Finding 5: EventEmitter Has No Error Handling**
If a cache invalidation listener throws, it will crash the worker unless the EventEmitter has an `error` listener. No `error` listener was observed.

**Recommendation:** Add `eventBus.on("error", (err) => logger.error(err, "EventBus error"))`.

---

## 10. Event Schema Versioning

**Finding 6: No Formal Event Schema Versioning**
```prisma
model OutboxEvent {
  eventVersion   Int @default(1)  ← version field exists
}
```
The version field is present in the schema but no evidence of version-aware deserializers or migration strategy for event payload schema changes. If a payload shape changes, old events in the DLQ will fail with deserialization errors.

**Recommendation:** Implement versioned event payload schemas and version-aware handlers.

---

## 11. Summary: Event Defects by Priority

| Defect | Priority | Impact |
|---|---|---|
| `SalesInvoicePOSTED` never relayed (name mismatch in relay) | P0 | All sales invoices missing journal entries |
| `GRNCreated` vs `GoodsReceiptNoteReceived` mismatch | P0 | Inventory purchase accounting broken |
| `ExpenseApproved`/`CreditNoteIssued`/`DebitNoteIssued` dead events | P1 | Expense and credit note accounting non-functional |
| `VendorInvoiceApproved` vs `VendorInvoicePosted` mismatch | P1 | AP accounting may be broken |
| Non-accounting events silently dropped | P2 | Data consistency risk |
| No DLQ replay automation | P2 | Manual intervention required for failures |
| EventEmitter missing error listener | P3 | Potential unhandled rejection crash |
| No event schema versioning | P3 | DLQ events may fail after schema change |
