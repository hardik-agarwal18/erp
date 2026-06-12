# Stock Journals Module

**Location:** `src/domains/inventory/stock-journals/`

Handles inter-godown stock transfers. A Stock Journal moves goods from a source godown (`fromGodownId`) to a destination godown (`toGodownId`). Created in `DRAFT` status; posted via the `POST /:id/post` endpoint which atomically deducts from source and increments destination.

---

## Files

| File | Purpose |
|---|---|
| `stock-journal.service.ts` | Create + post logic with full transactional stock transfer |
| `stock-journal.controller.ts` | HTTP request/response handling |
| `stock-journal.routes.ts` | Express route definitions |
| `stock-journal.repository.ts` | Data access (Prisma) |
| `stock-journal.types.ts` | TypeScript interfaces |
| `stock-journal.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/stock-journals`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/stock-journals` | ✅ | `INVENTORY_CREATE` | Create a DRAFT stock journal |
| `GET` | `/stock-journals` | ✅ | `INVENTORY_VIEW` | List journals with filters |
| `GET` | `/stock-journals/:id` | ✅ | `INVENTORY_VIEW` | Get a single journal |
| `POST` | `/stock-journals/:id/post` | ✅ | `INVENTORY_UPDATE` | Post the journal (execute transfer) |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`stock-journal.types.ts`)

### `CreateStockJournalInput`
```typescript
{
  journalNumber: string;
  fromGodownId: string;
  toGodownId: string;
  date: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    batchId?: string;
  }>;
}
```

### `StockJournalFilters`
```typescript
{
  status?: string;
  fromGodownId?: string;
  toGodownId?: string;
}
```

---

## Service Functions (`stock-journal.service.ts`)

### `journalService.create(organizationId, actorUserId, payload)`
Creates a DRAFT stock journal:
1. Validates `journalNumber` uniqueness.
2. Validates both `fromGodownId` and `toGodownId` exist for the organization.
3. Persists via repository.
4. Records `JOURNAL_CREATED` audit event.

### `journalService.post(id, organizationId, actorUserId, payload?)`
Posts the journal, executing the inter-godown transfer. **All inside `prisma.$transaction`**:
1. Validates journal exists and is `DRAFT`. Throws `400` if already posted.
2. For each journal item:
   - Validates batch is assigned for batch-tracked products.
   - Requires `serialNumberIds[]` matching `quantity` for serial-tracked products.
   - **Source checks:**
     - Verifies `InventoryItem.quantity >= item.quantity` in source godown. Throws `400 Insufficient stock` if not.
     - Verifies `BatchInventoryItem.quantity >= item.quantity` in source godown for batch items.
   - **Source deduction:**
     - Decrements `InventoryItem.quantity` in source godown.
     - Decrements `BatchInventoryItem.quantity` in source godown for batch items.
   - **Destination increment:**
     - Creates or increments `InventoryItem` in destination godown (preserves `averageCost` from source).
     - Creates or increments `BatchInventoryItem` in destination godown for batch items.
   - **Serial number handling:**
     - Validates each serial is `AVAILABLE` and located in source godown.
     - Updates `SerialNumber.godownId` to destination godown.
     - Creates two `InventoryMovement` records (source: qty `-1`, type `JOURNAL`; dest: qty `+1`, type `JOURNAL`).
   - **Non-serial movement:**
     - Creates two `InventoryMovement` records (source: qty `-item.quantity`; dest: qty `+item.quantity`).
3. Sets journal `status = "COMPLETED"`.
4. Records `JOURNAL_POSTED` audit event.

---

## Repository Functions (`stock-journal.repository.ts`)

| Function | Description |
|---|---|
| `create(orgId, data)` | Creates journal + items |
| `findById(id, orgId)` | Fetches journal with items |
| `list(orgId, filters, query)` | Paginated listing |
| `findByJournalNumber(num, orgId)` | Uniqueness check |
