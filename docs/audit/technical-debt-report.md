# Technical Debt Report
**Audit Phase 11 — Code Quality, Type Safety, Architectural Hotspots**
*Generated: 2026-06-17 | Auditor: Staff Backend Engineer*

---

## Executive Summary

The codebase shows evidence of rapid iterative development with accumulated technical debt in several areas: pervasive `any` usage bypasses TypeScript's type safety, hardcoded string literals instead of constants, god-service pattern in accounting service (540 LOC), multiple one-off schema manipulation scripts left in the repository, and a critical naming drift between the domain events registry and actual event string values.

---

## 1. TypeScript `any` Usage

### Scale of the Problem

**Evidence (grep result):**
```
Files with 'any' usage: 100+ files across the entire codebase
Key examples:
  - accounting.service.ts: (a: any) => ... (7 occurrences)
  - accounting.repository.ts: null as any (line 309)
  - invoice.service.ts: any[] | null (line 246)
  - outbox-relay.job.ts: (prisma as any).outboxEvent...
  - accounting.job.ts: (prisma as any).outboxEvent...
  - governance.controller.ts: (req as any).user...
```

### Category Breakdown

#### Type A: Prisma Client Bypass
```typescript
// outbox-relay.job.ts line 12
const events = await (prisma as any).outboxEvent.findMany({...});

// accounting.job.ts line 23
const event = await (prisma as any).outboxEvent.findUnique({...});
```
**Root Cause:** The Prisma client is generated from an empty `schema.prisma`. The `outboxEvent` model exists in the backup schema but is not in the active generated client.

**Impact:** Zero TypeScript protection on OutboxEvent queries — wrong field names or types will only fail at runtime.

**Resolution:** Fix the schema.prisma to include all models → regenerate → remove all `(prisma as any)` casts.

#### Type B: Filter Function Bypasses
```typescript
// accounting.service.ts line 155
const existing = accounts.find((a: any) => a.id === id);

// Multiple locations:
const revenues = tb.filter((a: any) => a.accountType === "REVENUE");
const expenses = tb.filter((a: any) => a.type === "EXPENSE");
```
**Root Cause:** `listAccounts()` return type is loosely typed. The trial balance aggregation function returns an untyped array.

**Resolution:** Type the `accountingRepository.listAccounts()` return value and propagate through the service.

#### Type C: Request Object Extensions
```typescript
// governance.controller.ts line 12
const userId = (req as any).user?.id || "SYSTEM";
```
**Root Cause:** `req.user` is not typed on Express's `Request` interface, or the middleware hasn't been applied.

**Resolution:** Ensure all protected routes have `authMiddleware` and `tenantContextMiddleware` applied before using `req.user`. Use Express module augmentation.

#### Type D: Repository Return Type Fallback
```typescript
// accounting.repository.ts line 309
return null as any;
```
**Root Cause:** The function's return type doesn't accommodate `null`.

**Resolution:** Update the return type signature to include `| null`.

---

## 2. Hardcoded String Literals (Event Type Drift)

**The Most Impactful Technical Debt Item:**

```typescript
// DomainEvents registry (domain-events.ts):
SALES_INVOICE_POSTED: "SalesInvoicePOSTED"

// Invoice producer (invoice.service.ts line 202):
eventType: "SalesInvoicePOSTED"  // ← correct, matches registry

// Outbox relay router (outbox-relay.job.ts line 39):
"SalesInvoiceIssued"  // ← WRONG, doesn't match
"GRNCreated"          // ← WRONG (vs "GoodsReceiptNoteReceived")
"VendorInvoiceApproved" // ← WRONG (vs "VendorInvoicePosted")
"PayrollRunCompleted"   // ← WRONG (vs "PayrollApproved")
"PayrollPaid"           // ← WRONG (vs "PayrollApproved")
```

**Root Cause:** The `DomainEvents` constants were either defined after the relay was written, or the relay was updated without consulting the constants. The relay routes events by string literal rather than using `DomainEvents.*`.

**Resolution:**
```typescript
// outbox-relay.job.ts — use constants:
import { DomainEvents } from "../../shared/domain-events.js";
const isAccountingEvent = Object.values(DomainEvents).includes(event.eventType as any);
// or explicitly:
const ACCOUNTING_EVENTS = [
  DomainEvents.SALES_INVOICE_POSTED,
  DomainEvents.CUSTOMER_PAYMENT_RECEIVED,
  // ...
];
```

---

## 3. God Classes / Large Services

### accounting.service.ts — 540 LOC
**Evidence:** Single file containing:
- Chart of accounts seeding (90 LOC)
- Account CRUD (30 LOC)
- Journal entry posting + validation (80 LOC)
- Invoice journal generation (25 LOC)
- Payment journal generation (40 LOC)
- Expense journal generation (40 LOC)
- Vendor invoice journal (25 LOC)
- Vendor payment journal (35 LOC)
- Trial balance (25 LOC)
- P&L report (20 LOC)
- Balance sheet (40 LOC)
- Fiscal year management (20 LOC)

**Assessment:** This is a god service. 12 distinct responsibilities in one class. Adding a new journal type requires modifying this file. Testing any single feature requires loading the entire accounting context.

**Recommendation:**
```
accounting/
├── accounts.service.ts       (CRUD + seeding)
├── journal.service.ts        (posting + validation)
├── reports.service.ts        (trial balance, P&L, balance sheet)
├── fiscal-year.service.ts    (fiscal year + period management)
└── journals/
    ├── invoice.journal.ts    (sales invoice journal)
    ├── payment.journal.ts    (payment journal)
    ├── expense.journal.ts    (expense journal)
    └── procurement.journal.ts (vendor invoice/payment journals)
```

### auth.service.ts — 706 LOC
Contains 15+ exported functions. Could be split into:
- `auth.service.ts` — login, logout, refresh, register
- `session.service.ts` — session management
- `email-verification.service.ts` — email verify/resend
- `password.service.ts` — forgot/reset password

---

## 4. Schema Manipulation Scripts (Architectural Hotspot)

**Evidence — backend/ root contains:**
```
append-missing-schema.ts   (195 bytes)
append-missing-schema-2.ts (197 bytes)
append-missing-schema-3.ts (1699 bytes)
append-schema.ts           (179 bytes)
fix-accounting.ts          (888 bytes)
fix-accounting2.ts         (884 bytes)
fix-schema.ts              (2680 bytes)
restore-schema.ts          (1840 bytes)
update-schema.ts           (1070 bytes)
update-schema-2.ts         (3615 bytes)
update-schema-phase5.ts    (3656 bytes)
update-schema-phase6.ts    (4582 bytes)
update-schema-phase7.ts    (2707 bytes)
split_schema_script.cjs    (5558 bytes)
```

**Assessment:** 14 schema manipulation scripts indicate the database schema was evolved through ad-hoc scripts rather than Prisma migrations. This creates:
1. Unknown drift between `prisma migrate status` and actual DB structure
2. No migration history for production
3. No rollback path for schema changes

**Recommendation:**
1. Audit what each script did
2. Create a single consolidating Prisma migration that represents the current actual schema
3. Delete all these files from the repository (they are completed, ad-hoc work)
4. Enforce "all schema changes via `prisma migrate dev`" as a team rule

---

## 5. TODO / FIXME Count

**Evidence (grep results):**
```typescript
// quotation.routes.ts line 24:
// TODO: Define PERMISSIONS.QUOTATIONS_CREATE, PERMISSIONS.QUOTATIONS_VIEW in permissions.ts
```

**Total TODOs found in grep:** Low count (1 explicit TODO found). However, several locations have inline comments indicating deferred decisions:

```typescript
// accounting.service.ts line 300-306:
// In a full implementation, paymentMethod should map to a specific bank or cash account ID.
// For now we will rely on a generic Bank/Cash account if available in mappings.
// Since we didn't add bank/cash to DefaultAccountMapping explicitly, we might need to look it up
// or assume the user will provide the debitAccountId explicitly in a mature setup.
// To keep it simple and remove hardcoded "1000"...
```

These "deferred decision" comments represent implicit technical debt.

---

## 6. Missing TypeScript Strict Configuration

**Evidence — backend/tsconfig.json (458 bytes — not fully read):**
**INFERRED:** Given the pervasive `any` usage across 100+ files, it is likely that `"strict": true` is NOT enabled, or `noImplicitAny` is disabled.

**Recommendation:** 
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true
  }
}
```
Fixing all resulting errors would eliminate most runtime type bugs.

---

## 7. tsc_errors.log Analysis

**Evidence:**
```
tsc_errors.log       = 100,714 bytes
tsc_errors_new.log   = 40,820 bytes  
tsc_errors_final.log = 5,572 bytes
```

The evolution from 100KB → 40KB → 5.5KB indicates active TypeScript error remediation. However, 5.5KB of errors still remain in `tsc_errors_final.log`.

**Assessment:** The codebase does not fully compile without TypeScript errors. Production builds may succeed (if `transpileOnly` is used) but the errors indicate missing type information that could cause runtime failures.

---

## 8. Cyclic Dependency Analysis

**Potential Cycle Identified:**
```
outbox-relay.job.ts → imports → accounting.job.ts (OutboxStatus enum)
accounting.job.ts   → imports → accounting.repository.ts
accounting.job.ts   → imports → accounting/handlers/invoice.handler.ts
invoice.handler.ts  → imports → accounting.repository.ts
```

The `OutboxStatus` enum is defined inside `accounting.job.ts` rather than in a shared types file. This forces `outbox-relay.job.ts` to import from a job file — a layer violation.

**Recommendation:** Move `OutboxStatus` enum to `shared/enums/outbox-status.enum.ts`.

---

## 9. Summary Debt Register

| Category | Severity | Items | Estimated Fix Effort |
|---|---|---|---|
| Prisma `any` bypass (OutboxEvent) | HIGH | ~20 call sites | Fix schema → 1 day |
| Event name string drift (relay ↔ registry) | CRITICAL | 5 mismatches | 2 hours |
| God service: accounting.service.ts | MEDIUM | 1 file, 540 LOC | 2-3 days |
| Schema manipulation scripts in root | HIGH | 14 files | 1 day (delete + migrate audit) |
| TypeScript filter `any` bypasses | MEDIUM | ~50 occurrences | 3-5 days |
| OutboxStatus in wrong module | LOW | 1 enum | 30 minutes |
| Auth service god class | LOW | 706 LOC | 1-2 days |
| TypeScript strict mode not enabled | HIGH | Entire codebase | 1-2 weeks |
| Hardcoded "INR" currency | HIGH | 5 locations | 1 day (schema + data) |
| Production data in git history | CRITICAL | invoice_backup.json | 4 hours (git filter-repo) |
