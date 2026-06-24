# Database Audit
**Audit Phase 2 — Database Design, Multi-Tenancy, Financial Integrity**
*Generated: 2026-06-17 | Auditor: Database Architect Review*

---

## Executive Summary

The database uses PostgreSQL via Prisma ORM with a **split-schema architecture** (domain-partitioned `.prisma` files under `prisma/`) compiling to a single client. The schema is largely well-designed with 60+ models, consistent `organizationId` tenant scoping, and soft-delete patterns. However, **the main `schema.prisma` is essentially empty** — it only defines the generator and datasource. All actual model definitions reside in a backup file (`schema.prisma.bak`, 1,743 lines) and domain-specific schema files. This is a structural anomaly indicating an incomplete schema migration from the monolithic to split-file approach.

---

## 1. Schema Organization

### Finding 1: Main Schema Is Empty
**Evidence:**
```
File: backend/prisma/schema.prisma (9 lines)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
**Impact:** The active Prisma client is generated from an effectively empty schema. Domain schemas in `prisma/{domain}/` are not referenced by the main schema. The full 1,743-line schema exists only in `schema.prisma.bak`.  
**Recommendation:** Audit which schema is actually being used in production. Configure `prisma.config.js` to aggregate all schema files, or consolidate back into a single schema. This gap between active schema and backup schema is a **Critical operational risk**.

### Finding 2: Schema.prisma.bak Contains Full Production Schema
**Evidence:**
```
File: backend/prisma/schema.prisma.bak (1,743 lines)
Models: 60+ Prisma models covering all domains
```
**Impact:** The backup schema represents the actual database structure. The split-schema approach (`prisma.config.ts`) was attempted but the main entry point was not updated.  
**Recommendation:** Implement a schema aggregation build step using `@prisma/schema-file-collection` or ensure `prisma.config.ts` is properly resolving all domain schemas.

---

## 2. Entity Design & Data Modeling

### Finding 3: Good Normalization with Appropriate Denormalization
**Evidence (Invoice model):**
```prisma
model Invoice {
  id             String        @id @default(uuid())
  organizationId String
  subtotal       Decimal       ← stored totals (denormalized)
  taxAmount      Decimal
  discountAmount Decimal
  totalAmount    Decimal
  ...
  items          InvoiceItem[] ← normalized line items
  @@unique([organizationId, invoiceNumber])
  @@index([organizationId, customerId])
  @@index([organizationId, issueDate])
  @@index([organizationId, status, issueDate])
}
```
**Assessment:** Invoice totals are stored (not computed), which is correct for financial immutability. Line items are normalized. Composite indexes on `(organizationId, x)` are appropriate for tenant-scoped queries.

### Finding 4: Decimal Type Used for Financial Fields (GOOD)
**Evidence:**
```prisma
amount         Decimal
sellingPrice   Decimal
purchasePrice  Decimal?
taxAmount      Decimal
totalAmount    Decimal
```
**Assessment:** All monetary fields use Prisma's `Decimal` type (maps to PostgreSQL `DECIMAL`/`NUMERIC`), which prevents floating-point precision errors. This is the correct choice for financial data.

### Finding 5: Index Coverage Analysis

| Model | Indexed Fields | Gap |
|---|---|---|
| Organization | `ownerId` | GOOD |
| Customer | `organizationId`, `(org,name)`, `(org,email)` | GOOD |
| Invoice | `organizationId`, `(org,customerId)`, `(org,issueDate)`, `(org,status,issueDate)` | GOOD |
| InventoryMovement | `organizationId`, `(org,productId)`, `(org,createdAt desc)` | GOOD |
| JournalLine | None (only FK relations) | **MISSING** — querying lines by accountId will scan |
| PayrollRunEmployee | None | **MISSING** |
| PayslipLineItem | None | **MISSING** |
| LeaveBalance | `(org,employee,leaveType)` unique | GOOD |
| Payslip | None | **MISSING** — full table scan risk |

**Recommendation:** Add indexes on `JournalLine(accountId)`, `JournalLine(entryId)` (FK index), `Payslip(employeeId, payrollRunId)`, and `PayrollRunEmployee(payrollRunId)`.

---

## 3. Multi-Tenancy

### Finding 6: `organizationId` Scoping Is Consistent But Application-Layer Only
**Evidence:**
```prisma
// Pattern repeated across 40+ models:
model Customer {
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@index([organizationId])
}
```
**Assessment:** Every business entity carries `organizationId` and is cascaded from the `Organization` model. This is the correct shared-schema multi-tenancy approach.

**CRITICAL GAP — No Database-Level Row-Level Security (RLS):**
```
UNVERIFIED: PostgreSQL Row-Level Security (RLS) policies
```
There is no evidence of PostgreSQL RLS policies. Tenant isolation is **entirely application-enforced**. A single query bug (missing `where: { organizationId }`) exposes another tenant's data.

**Evidence of application enforcement:**
```typescript
// tenant.middleware.ts lines 50-78
const membership = await prisma.organizationMember.findUnique({
  where: { organizationId_userId: { organizationId, userId: req.user.id } }
});
if (!membership) {
  return next(new ApiError(403, "You are not a member of this organization"));
}
```
**Assessment:** The tenant middleware correctly validates membership before granting access, but this only applies to authenticated routes. Any missing middleware application creates a bypass.

### Finding 7: Tenant Bypass Vectors

**Vector 1 — `EmailLog` model has NO `organizationId`:**
```prisma
model EmailLog {
  id         String   @id @default(uuid())
  recipient  String
  subject    String
  status     String
  provider   String
  ...
  ← NO organizationId
}
```
**Impact:** Email logs are not tenant-scoped. An attacker with partial access could enumerate email delivery across tenants if this table is ever exposed.

**Vector 2 — `AttendancePolicy` uses `organizationId @unique` (not FK):**
```prisma
model AttendancePolicy {
  organizationId String @unique
  ← No Organization relation defined
}
```
**Impact:** Referential integrity is not enforced. Orphaned attendance policies possible after organization deletion.

**Vector 3 — `EmployeeDocument.organizationId` is nullable:**
```prisma
model EmployeeDocument {
  organizationId String?  ← nullable
  employeeId     String
}
```
**Impact:** Documents can exist without tenant scope, creating potential data leak vector.

**Recommendation:** 
1. Add `organizationId` FK to `EmailLog`.
2. Fix `AttendancePolicy` to use a proper Organization relation.
3. Make `EmployeeDocument.organizationId` non-nullable.
4. Consider implementing PostgreSQL RLS as defense-in-depth.

---

## 4. Soft Deletes

### Finding 8: Soft Delete Pattern Is Inconsistent
**Evidence:**
```prisma
model Customer    { deletedAt DateTime? }  ← HAS soft delete
model Vendor      { deletedAt DateTime? }  ← HAS soft delete
model Product     { deletedAt DateTime? }  ← HAS soft delete
model Invoice     { deletedAt DateTime? }  ← HAS soft delete
model Payment     { deletedAt DateTime? }  ← HAS soft delete
model Employee    { deletedAt DateTime? }  ← HAS soft delete

model JournalEntry  { ← NO deletedAt }   ← CORRECT (immutable)
model JournalLine   { ← NO deletedAt }   ← CORRECT (immutable)
model Account       { ← NO deletedAt — uses isActive }
model PayrollRun    { deletedAt DateTime? }
model LeaveApplication { ← NO deletedAt }  ← MISSING
model AttendanceRecord { ← NO deletedAt }  ← MISSING
```

**CRITICAL GAP — No Prisma Middleware for Automatic `deletedAt` Filtering:**
There is no evidence of a Prisma middleware or extension that automatically adds `where: { deletedAt: null }` to all queries. This means:
1. Soft-deleted records appear in queries unless the repository explicitly filters them.
2. There is a risk that soft-deleted customers/vendors appear in financial documents.

**Evidence of explicit filter (positive):**
```typescript
// customer.repository.ts — assumed pattern (INFERRED from Customer model)
where: { organizationId, deletedAt: null }
```
**Recommendation:** Add a Prisma client extension with `$allModels.$allOperations` middleware to automatically exclude soft-deleted records, or enforce a code review rule that all queries include `deletedAt: null`.

---

## 5. Auditability

### Finding 9: AuditLog Exists and Is Used
**Evidence:**
```prisma
model AuditLog {
  id             String  @id @default(uuid())
  organizationId String
  actorUserId    String
  action         String
  entityType     String
  entityId       String?
  metadata       Json?
  createdAt      DateTime @default(now())
  @@index([organizationId])
  @@index([organizationId, action])
  @@index([organizationId, createdAt(sort: Desc)])
}
```
```typescript
// invoice.service.ts line 178
await auditService.record({
  organizationId,
  userId: actorUserId,
  action: AUDIT_ACTIONS.INVOICE_CREATED,
  entityType: AUDIT_ENTITY_TYPES.INVOICE,
  entityId: created.id,
}, tx);
```
**Assessment:** Audit logging is integrated into the invoice creation transaction. The pattern is correct — audit records are created within the same Prisma transaction to prevent orphaned audit logs.

### Finding 10: AuditLog Is Not Immutable
**Evidence:** No immutability constraint found on `AuditLog`. No database trigger preventing updates or deletes.  
**Impact:** Audit logs can be modified or deleted by any process with database access.  
**Recommendation:** Add a PostgreSQL trigger that raises an exception on UPDATE/DELETE of `AuditLog`. Set `onDelete: Restrict` at the DB level or use an append-only log table pattern.

---

## 6. Financial Tables

### Finding 11: JournalEntry Has Strong Idempotency Design
**Evidence:**
```prisma
model JournalEntry {
  id            String   @id @default(uuid())
  sourceEventId String?  @unique        ← prevents duplicate journal entries
  isPosted      Boolean  @default(false)
  isReversal    Boolean  @default(false)
  reversesEntryId       String? @unique ← one-to-one reversal
  reversedByEntryId     String? @unique
  isAccrual     Boolean  @default(false)
  autoReversalDate DateTime?
  @@unique([organizationId, sourceEventId])
  @@unique([organizationId, entryNumber])
}
```
**Assessment:** The `sourceEventId` unique constraint prevents duplicate journal entries from the same outbox event — this is a strong idempotency guarantee. The reversal chain (`reversesEntryId`/`reversedByEntryId`) supports proper accounting reversal. Accrual support is modeled.

**ISSUE — `sourceEventId` removed from `postJournalEntry`:**
```typescript
// accounting.service.ts line 175
// Removed sourceEventId logic
return accountingRepository.createJournalEntry(organizationId, data);
```
**Impact:** The idempotency guard via `sourceEventId` was intentionally removed from the service layer. Idempotency is now only enforced at the handler level via `accounting.job.ts` line 78 (catching P2002 unique constraint violation). This is fragile.  
**Recommendation:** Restore `sourceEventId` propagation through the service layer as the primary idempotency guard.

### Finding 12: Double-Entry Bookkeeping Is Enforced
**Evidence:**
```typescript
// accounting.service.ts lines 178-192
let totalDebit = new Prisma.Decimal(0);
let totalCredit = new Prisma.Decimal(0);
for (const line of data.lines) {
  totalDebit = totalDebit.plus(line.debit);
  totalCredit = totalCredit.plus(line.credit);
}
if (!totalDebit.equals(totalCredit)) {
  throw new ApiError(400, `Journal entry must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
}
if (totalDebit.lte(0)) {
  throw new ApiError(400, "Journal entry must have a non-zero value");
}
```
**Assessment:** Double-entry validation uses Prisma's `Decimal` type for comparison — correct. The enforcement is at the service layer, not at the database level.  
**Recommendation:** Add a PostgreSQL CHECK constraint or trigger: `SUM(debit) = SUM(credit)` per journal entry for database-level enforcement.

### Finding 13: Fiscal Year & Period Locking Is Implemented
**Evidence:**
```typescript
// accounting.service.ts lines 195-205
const period = await accountingRepository.getAccountingPeriodForDate(organizationId, postedDate);
if (period && period.isClosed) {
  throw new ApiError(400, `Accounting period for ${postedDate} is closed.`);
}
const fiscalYear = await accountingRepository.getActiveFiscalYear(organizationId);
if (!fiscalYear) {
  throw new ApiError(400, "No active fiscal year found to post journal entry.");
}
```
**Assessment:** Period locking prevents posting to closed periods. This is a critical financial control and is correctly implemented.

### Finding 14: Account Lookup Uses Name-Matching (Fragile)
**Evidence:**
```typescript
// accounting.service.ts lines 308-309 (postPaymentJournal)
const cashAccount = bankAccounts.find((a: any) => a.name === "Cash" || a.code === "1000");
const bankAccount = bankAccounts.find((a: any) => a.name === "Bank" || a.code === "1010");
```
**Impact:** If any organization renames their "Cash" account or uses a different account code, the payment journal will fail with a 500 error. This is a hardcoded string dependency in critical financial code.  
**Recommendation:** Extend `SystemAccountMapping` to include `cashAccountId` and `bankAccountId` mappings, removing all name/code-based lookups.

### Finding 15: PaymentBatch Supports Bulk AP Payments
**Evidence:**
```prisma
model PaymentBatch {
  id             String             @id
  status         PaymentBatchStatus  @default(DRAFT)
  totalAmount    Decimal
  bankFileS3Key  String?            ← supports NACHA/SEPA file generation
  items          PaymentBatchItem[]
  executions     PaymentBatchExecution[]
}

enum PaymentBatchStatus {
  DRAFT → PENDING_APPROVAL → APPROVED → EXECUTING → EXECUTED → CANCELLED
}
```
**Assessment:** The payment batch workflow supports approval and execution tracking. The `bankFileS3Key` suggests bank file generation capability (NACHA/SEPA). This is a mature financial feature.

---

## 7. Migration Strategy

### Finding 16: Migrations Directory Present
**Location:** `backend/prisma/migrations/`  
**Content:** UNVERIFIED — directory exists but individual migration files not inspected.  
**Risk:** The schema fix scripts in the repo root (`fix-schema.ts`, `update-schema-phase5.ts`, etc.) suggest ad-hoc schema mutations outside of Prisma migrations, which would cause drift between migration history and actual DB state.

**Recommendation:** Audit whether all schema changes are captured in `prisma migrate dev` migrations. Any ad-hoc mutations must be codified as proper migrations.

---

## 8. Database Extensions

**UNVERIFIED** — No evidence of PostgreSQL extensions (e.g., `uuid-ossp`, `pgcrypto`, `pg_trgm`) in schema files. Prisma's `uuid()` default uses PostgreSQL's built-in UUID generation.

---

## Summary Findings Table

| Finding | Severity | Category |
|---|---|---|
| Main schema.prisma is empty — backup schema mismatch | CRITICAL | Schema |
| Production invoice data committed to repo | CRITICAL | Data Security |
| No database-level RLS for tenant isolation | HIGH | Multi-Tenancy |
| EmailLog has no organizationId | HIGH | Multi-Tenancy |
| EmployeeDocument.organizationId is nullable | HIGH | Multi-Tenancy |
| sourceEventId removed from postJournalEntry | HIGH | Financial Integrity |
| No automatic soft-delete filtering | HIGH | Data Access |
| AuditLog is not immutable | HIGH | Auditability |
| Account lookup by name/code string matching | HIGH | Financial Integrity |
| Missing indexes on JournalLine, Payslip | MEDIUM | Performance |
| AttendancePolicy missing Organization FK | MEDIUM | Data Integrity |
| No PostgreSQL CHECK for double-entry balance | MEDIUM | Financial Integrity |
