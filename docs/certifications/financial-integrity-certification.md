# Financial Integrity Certification — REVOKED

## ⚠️ STATUS: REVOKED — 2026-06-17

This certification was originally issued as PASSED. It has been **formally revoked** following a
full repository audit that discovered a P0 financial integrity defect active at the time of issuance.

---

## Defect That Invalidated This Certification

### Root Cause

`outbox-relay.job.ts` contained a hardcoded string routing list with **five mismatched event type
strings** that did not match the values emitted by domain producers. The most critical mismatch:

| Relay Expected | Producer Emitted | Handler Existed? | Effect |
|---|---|---|---|
| `"SalesInvoiceIssued"` | `"SalesInvoicePOSTED"` | ✅ Yes | **Journal never created** |
| `"GRNCreated"` | `"GoodsReceiptNoteReceived"` | ✅ Yes | Journal never created |
| `"VendorInvoiceApproved"` | `"VendorInvoicePosted"` | ✅ Yes | Journal never created |
| `"VendorPaymentCompleted"` | `"VendorPaymentCreated"` | ✅ Yes | Journal never created |
| `"PayrollRunCompleted"` | `"PayrollApproved"` | ✅ Yes | Journal never created |

**Business impact:** Every `SalesInvoicePOSTED` outbox event since deployment was routed to no
queue. The GL Accounts Receivable and Revenue accounts were never updated for any posted invoice.

---

## Remediation Applied — 2026-06-17

### Code Fix
**File:** `backend/src/queue/jobs/outbox-relay.job.ts`

Replaced all hardcoded string literals with `DomainEvents` constants imported from
`src/shared/domain-events.ts`. The routing set is now compile-time verified against the registry.

```typescript
// Before (BROKEN):
const isAccountingEvent = [
  "SalesInvoiceIssued",   // ← wrong
  "GRNCreated",           // ← wrong
  "VendorInvoiceApproved",// ← wrong
  ...
].includes(event.eventType);

// After (FIXED):
import { DomainEvents } from "../../shared/domain-events.js";
const ACCOUNTING_EVENT_TYPES: ReadonlySet<string> = new Set([
  DomainEvents.SALES_INVOICE_POSTED,      // "SalesInvoicePOSTED"
  DomainEvents.GRN_RECEIVED,              // "GoodsReceiptNoteReceived"
  DomainEvents.VENDOR_INVOICE_POSTED,     // "VendorInvoicePosted"
  DomainEvents.VENDOR_PAYMENT_CREATED,    // "VendorPaymentCreated"
  DomainEvents.PAYROLL_APPROVED,          // "PayrollApproved"
  DomainEvents.CUSTOMER_PAYMENT_RECEIVED, // "CustomerPaymentReceived"
  DomainEvents.STOCK_ADJUSTMENT_POSTED,   // "StockAdjustmentPosted"
]);
```

### Data Recovery
Run `backend/scripts/reconcile-invoices.ts` to:
1. Identify all POSTED invoices missing a GL journal entry
2. Report total unrecognized revenue by organization
3. Reset orphaned outbox events to `PENDING` for idempotent reprocessing

```bash
# Step 1: Generate report (read-only)
npx ts-node --esm scripts/reconcile-invoices.ts

# Step 2: Requeue after reviewing the report
npx ts-node --esm scripts/reconcile-invoices.ts --requeue

# Step 3: Wait for outbox relay to process, then verify
npx ts-node --esm scripts/reconcile-invoices.ts
# Expected output: "RECONCILIATION PASSED"

# Step 4: Run existing ledger validation
npx ts-node --esm scripts/validate-ledger.ts
# Expected output: "✅ Validation Passed"
```

---

## Re-Certification Criteria

This certification may be re-issued as PASSED only after:

- [ ] `reconcile-invoices.ts` reports zero missing journal entries
- [ ] `validate-ledger.ts` exits with code 0
- [ ] Integration test `tests/integration/accounting-events.test.ts` passes
- [ ] The outbox relay routing set is reviewed in code review
- [ ] A regression test asserting relay routes `DomainEvents.SALES_INVOICE_POSTED` is added

---

## Lessons Learned

1. **Use constants, not literals.** The `DomainEvents` registry existed and was not used in the relay.
2. **Test the relay, not just the handler.** The integration test `accounting-events.test.ts` only
   tested the accounting job's switch statement — it bypassed the relay routing entirely.
3. **Certify the full chain.** The certification verified the handler worked in isolation. The end-to-
   end path (producer → outbox → relay → queue → handler → journal) was not tested end-to-end.
4. **Never certify inferred behavior.** The original certification marked architectural review as
   "Verified" — these are fundamentally different claims.

---

*Original sign-off: PASSED (Phase 1 & 2)*
*Revocation date: 2026-06-17*
*Revoked by: Principal Architect Audit*
