# Performance Review
**Audit Phase 6 — Query Performance, N+1 Risks, Memory Pressure**
*Generated: 2026-06-17 | Auditor: Platform Reliability Engineer*

---

## Executive Summary

The codebase uses Prisma ORM with explicit `select` and `include` clauses in most repositories. Rate limiting and Redis caching are present. However, several high-risk patterns were identified: account lookup by iterating all accounts in financial journals, N+1 query patterns in invoice line item processing, large transaction boundaries, and a batch size of 100 events processed synchronously in the outbox relay loop.

---

## 1. Critical Performance Findings

### 🔴 CRITICAL: Account Lookup Scans Entire Chart of Accounts on Every Journal Post
**File:** `src/domains/financials/accounting/accounting.service.ts`

**Evidence:**
```typescript
// postPaymentJournal — lines 307-315
const bankAccounts = await accountingRepository.listAccounts(organizationId);
// Returns ALL accounts for the organization
const cashAccount = bankAccounts.find((a: any) => a.name === "Cash" || a.code === "1000");
const bankAccount = bankAccounts.find((a: any) => a.name === "Bank" || a.code === "1010");
```

**Same pattern in postExpenseJournal (lines 331-350):**
```typescript
const accounts = await accountingRepository.listAccounts(organizationId);
const expAccount = accounts.find((a: any) => a.name === targetAccountName);
```

**Impact:**
- Every payment journal post fetches ALL chart of accounts entries (potentially 40-200 rows)
- This happens on every invoice payment, vendor payment, and expense posting
- At scale: 1,000 payments/day × 40-200 account rows = 40,000-200,000 unnecessary row reads/day
- Memory: full account list deserialized into JS objects on each call

**Recommendation:**
1. Use `SystemAccountMapping` for all system account lookups (already exists in schema)
2. Add `cashAccountId` and `bankAccountId` to `SystemAccountMapping`
3. Query by code directly: `prisma.account.findFirst({ where: { organizationId, code: "1010" } })`

---

### 🟠 HIGH: N+1 Query Pattern in Invoice Posting (Inventory Loop)
**File:** `src/domains/financials/invoices/invoice.service.ts`

**Evidence — createInvoice (lines 138-167):**
```typescript
if (status === "POSTED") {
  for (const item of lineItems) {  // ← loop over N items
    if (item.productType !== "PHYSICAL") continue;
    const inventory = await invoiceRepository.findInventoryItemForProduct(
      tx, organizationId, item.productId  // ← N queries (one per line item)
    );
    // ...
    await invoiceRepository.decrementInventoryItem(tx, ...); // ← N more queries
    await invoiceRepository.createInventoryMovement(tx, ...); // ← N more queries
  }
}
```

**Pattern:** For an invoice with 10 line items → 30 sequential database queries (find + decrement + movement per item). For a 50-item invoice → 150 queries, all within a single transaction.

**Impact:**
- Long-held transactions increase lock contention
- Sequential (not parallel) queries add latency proportional to N
- Risk of transaction timeout on large invoices

**Recommendation:**
1. Fetch all inventory items in a single query: `WHERE productId IN (...)`
2. Use `prisma.inventoryItem.updateMany()` with conditional logic or batch the decrements
3. Use `prisma.inventoryMovement.createMany()` for bulk movement creation

---

### 🟠 HIGH: Outbox Relay Processes 100 Events Synchronously in a Loop
**File:** `src/queue/jobs/outbox-relay.job.ts`

**Evidence:**
```typescript
const batchSize = 100;
const events = await prisma.outboxEvent.findMany({ take: batchSize, ... });

for (const event of events) {  // ← sequential loop
  try {
    await accountingQueue.add(...);           // Redis write
    await outboxEvent.update({ status: ... }); // DB write
  } catch { ... }
}
```

**Impact:**
- 100 sequential Redis enqueues + 100 DB updates = 200 sequential async operations
- If relay runs every 30 seconds and takes >30 seconds for 100 events, events pile up
- No batch database update (100 individual UPDATE queries)

**Recommendation:**
1. Use `prisma.$transaction` with `updateMany` for batch status updates
2. Use BullMQ's `Queue.addBulk()` for batch enqueue
3. Process in parallel with `Promise.all()` with concurrency limiter

---

### 🟠 HIGH: Accounting Service Seeds Accounts With Sequential Loop
**File:** `src/domains/financials/accounting/accounting.service.ts`

**Evidence — seedDefaultAccounts (lines 92-109):**
```typescript
const seedLevel = async (accounts: AccountSeed[], parentId?: string) => {
  for (const acc of accounts) {
    let existing = await accountingRepository.getAccountByCode(organizationId, acc.code);
    // ← N queries
    if (!existing) {
      existing = await accountingRepository.createAccount(...);  // ← N queries
    }
    if (acc.children?.length > 0) {
      await seedLevel(acc.children, existing.id);  // ← recursive, N^depth queries
    }
  }
};
```

**Impact:** For 40 accounts with children: approximately 80-120 sequential DB queries for initial organization setup. This is only run once, so the impact is bounded. However, it creates a slow first-time organization experience.

**Recommendation:** Use `createMany` with `skipDuplicates: true` for non-hierarchical accounts. Separate creation from parent-ID linking.

---

## 2. High Severity Performance Findings

### 🟠 HIGH: Missing Indexes on JournalLine
**Evidence — schema.prisma.bak:**
```prisma
model JournalLine {
  id        String
  entryId   String    // FK — no explicit index
  accountId String    // FK — no explicit index
  debit     Decimal
  credit    Decimal
}
```

**Impact:**
- Trial balance queries aggregate all journal lines by account: `GROUP BY accountId`
- Without an index on `accountId`, every trial balance computation scans the entire `JournalLine` table
- At scale (millions of journal lines), this becomes a full-table scan every time a financial report runs

**Recommendation:**
```sql
CREATE INDEX idx_journal_line_account_id ON "JournalLine"("accountId");
CREATE INDEX idx_journal_line_entry_id ON "JournalLine"("entryId");
```

---

### 🟡 MEDIUM: Trial Balance Loads All Lines Without Date Pagination
**Evidence — accounting.service.ts lines 431-432:**
```typescript
getTrialBalance: async (organizationId, filters) => {
  const lines = await accountingRepository.getTrialBalance(
    organizationId, filters.startDate, filters.endDate
  );
```

The trial balance aggregation is performed by the database (expected), but the result set of all account balances is loaded into memory. For organizations with many accounts, this could be large.

**Assessment:** Acceptable for current scale. Monitor with `EXPLAIN ANALYZE` as data grows.

---

### 🟡 MEDIUM: BullMQ Worker Concurrency Not Tuned Per Workload
**Evidence — worker.service.ts:**
```typescript
// Mail: concurrency 5 (reasonable)
// PDF: concurrency 2 (reasonable — CPU bound)
// Accounting: concurrency 5 (potentially problematic)
// Outbox relay: concurrency 1 (correct — single poller)
```

Accounting workers with concurrency 5 could cause 5 simultaneous journal entries competing for the same account balance rows, increasing lock contention.

**Recommendation:** Set accounting worker concurrency to 2-3 unless the database can handle higher parallelism. Monitor queue depth vs. throughput.

---

### 🟡 MEDIUM: Redis Cache Keys Not Namespaced by Environment
**Evidence — idempotency.middleware.ts line 11:**
```typescript
const cacheKey = `idempotency:${orgId}:${key}`;
```
No environment prefix (e.g., `prod:`, `staging:`). If staging and production share a Redis instance, idempotency keys could collide.

**Recommendation:** Add environment prefix: `` `${env.NODE_ENV}:idempotency:${orgId}:${key}` ``

---

### 🟡 MEDIUM: Large Invoice Transactions Hold Locks Too Long
**Evidence — invoice.service.ts line 105:**
```typescript
const invoice = await prisma.$transaction(async (tx) => {
  const invoiceNumber = await reserveInvoiceNumber(tx, organizationId);
  const created = await invoiceRepository.createInvoiceWithItems(tx, ...);
  
  // Loop over N inventory items (N queries)
  for (const item of lineItems) {
    const inventory = await findInventoryItemForProduct(tx, ...);
    await decrementInventoryItem(tx, ...);
    await createInventoryMovement(tx, ...);
  }
  
  await createFinancialTransaction(tx, ...);
  await auditService.record({...}, tx);
  await outboxEvent.create({...});
});
```

A single transaction includes: invoice creation + N inventory reads + N inventory updates + N movement creations + transaction log + audit log + outbox event.

**Impact:** For a 20-item invoice, this transaction holds locks on `InvoiceSequence`, `InventoryItem`, and `Invoice` rows for the duration of 60+ sequential queries. This creates serious contention under concurrent invoice posting.

**Recommendation:** 
1. Batch all inventory queries and updates
2. Consider optimistic locking or decoupled inventory deduction via separate transaction

---

## 3. Medium Severity Findings

### 🟡 MEDIUM: getMe Fetches All Memberships on Every Request
**Evidence — auth.service.ts line 688:**
```typescript
const memberships = await authRepository.listUserMemberships(userId);
```
Called for workspace switching and `getMe` endpoint. If a user belongs to many organizations, this fetch is expensive and not cached.

**Recommendation:** Cache membership list in Redis with invalidation on `OrganizationMember` changes.

---

### 🟢 LOW: Stats/Reports Computed On-Demand Without Caching
Reports appear to query live data. Dashboard-style aggregate queries (total revenue, outstanding payables) run on every page load.

**Assessment:** CacheService exists and is used. Caching strategy for reports is likely partial. Verify report endpoints use `cacheMiddleware`.

---

## 4. Memory Pressure

### 🟡 MEDIUM: PDF Generation In-Memory
**Assessment:** pdfkit generates PDF buffers in memory. Large invoices with many line items could generate multi-MB PDFs. No streaming PDF response observed.

**Recommendation:** Stream PDFs to S3 directly. Return a presigned URL instead of serving the buffer through the API.

---

## 5. Performance Summary Table

| Finding | Severity | Location | Impact |
|---|---|---|---|
| Account lookup scans all accounts | CRITICAL | accounting.service.ts:307-315 | High DB reads on every financial transaction |
| N+1 queries in invoice posting loop | HIGH | invoice.service.ts:138-167 | Lock contention, slow invoice post |
| Outbox relay sequential loop (100 events) | HIGH | outbox-relay.job.ts | Relay backlog under load |
| Missing JournalLine indexes | HIGH | schema.prisma.bak | Trial balance full-table scan |
| Account seed uses sequential queries | HIGH | accounting.service.ts:92-109 | Slow org setup |
| Large invoice transactions | MEDIUM | invoice.service.ts:105 | Lock contention |
| Trial balance no date pagination | MEDIUM | accounting.service.ts:431 | Memory on large orgs |
| Redis cache keys missing env prefix | MEDIUM | idempotency.middleware.ts | Key collision risk |
| Accounting worker concurrency 5 | MEDIUM | worker.service.ts:104 | Lock contention |
| getMe fetches all memberships | MEDIUM | auth.service.ts:688 | Uncached repeat query |
