# GRN Module (Goods Receipt Note)

**Location:** `src/domains/inventory/grn/`

Handles the receipt of goods from vendors into a specific godown. GRNs can be linked to a Purchase Order. Supports batch-tracked and serial-number-tracked products. On receiving (finalizing) a GRN, inventory levels, batch quantities, serial number records, and inventory movement logs are all updated atomically inside a single Prisma transaction.

---

## Files

| File | Purpose |
|---|---|
| `grn.service.ts` | Create + receive logic with full transactional inventory update |
| `grn.controller.ts` | HTTP request/response handling |
| `grn.routes.ts` | Express route definitions |
| `grn.repository.ts` | Data access (Prisma) |
| `grn.types.ts` | TypeScript interfaces |
| `grn.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/grns`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/grns` | ✅ | `INVENTORY_CREATE` | Create a new GRN (DRAFT status) |
| `GET` | `/grns` | ✅ | `INVENTORY_VIEW` | List GRNs with filters |
| `GET` | `/grns/:id` | ✅ | `INVENTORY_VIEW` | Get a single GRN with items |
| `POST` | `/grns/:id/receive` | ✅ | `INVENTORY_UPDATE` | Receive (finalize) a DRAFT GRN |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`grn.types.ts`)

### `GRNItem`
```typescript
{
  productId: string;
  poItemId?: string;
  orderedQty?: number;
  receivedQty: number;
  unitPrice: number;
  batchId?: string;           // Existing batch (for batch-tracked products)
  batchMode?: "CREATE_NEW" | "USE_EXISTING";
  batchNumber?: string;       // Required if batchMode = CREATE_NEW
  expiryDate?: string;        // Required if batchMode = CREATE_NEW
  manufactureDate?: string;
}
```

### `GRNFilters`
```typescript
{
  status?: string;
  vendorId?: string;
  godownId?: string;
  purchaseOrderId?: string;
}
```

---

## Validators (`grn.validators.ts`)

| Schema | Validates |
|---|---|
| `createGRNSchema` | `body: { grnNumber, vendorId?, receivedDate, godownId, purchaseOrderId?, items[] }` |
| `listGRNSchema` | `query: { page?, limit?, status?, godownId? }` |
| `receiveGRNSchema` | `body: { items: [{ grnItemId, serialNumbers?: string[] }] }` |

---

## Service Functions (`grn.service.ts`)

### `grnService.create(organizationId, actorUserId, payload)`
Creates a DRAFT GRN:
1. Validates `grnNumber` uniqueness.
2. Validates `godownId` exists.
3. If `purchaseOrderId` provided: validates PO exists and is in `APPROVED` or `PARTIALLY_RECEIVED` status.
4. For each item: if product is batch-tracked and `batchMode === "CREATE_NEW"`, creates a new `Batch` record with `quantity = 0`. Assigns `batchId` from created batch.
5. Persists GRN and items via `grnRepository.create()`.
6. Records `GRN_CREATED` audit event.

### `grnService.receive(id, organizationId, actorUserId, payload?)`
Receives (finalizes) a DRAFT GRN. **All operations inside `prisma.$transaction`**:
1. Validates GRN exists and is in `DRAFT` status.
2. For each GRN item:
   - Validates batch is assigned for batch-tracked products.
   - Requires `serialNumbers[]` matching `receivedQty` for serial-tracked products.
   - **Upserts `InventoryItem`** (creates if not exists, otherwise increments quantity using weighted average cost).
   - **Updates `Batch.quantity`** (global) and **upserts `BatchInventoryItem`** (per godown) for batch items.
   - For serial items: creates `SerialNumber` records (status: `AVAILABLE`) and individual `InventoryMovement` records.
   - For non-serial items: creates a single `InventoryMovement` (type: `GRN_RECEIPT`).
   - Updates linked PO items' `receivedQuantity` if `poItemId` is set.
3. Sets GRN `status = "COMPLETED"`.
4. Records `GRN_RECEIVED` audit event.
5. **Emits** `grn.completed` domain event (for downstream PO status update).

**Weighted Average Cost formula:**
```
newAvgCost = (currentQty * currentCost + receivedQty * receivedCost) / (currentQty + receivedQty)
```

---

## Repository Functions (`grn.repository.ts`)

| Function | Description |
|---|---|
| `create(orgId, data, tx?)` | Creates GRN + items in a transaction |
| `findById(id, orgId)` | Fetches GRN with all items |
| `list(orgId, filters, query)` | Paginated GRN listing |
| `findByGrnNumber(grnNumber, orgId)` | Uniqueness check |

---

## Controller Functions (`grn.controller.ts`)

| Function | HTTP Status | Key Behavior |
|---|---|---|
| `create` | 201 Created | Returns created GRN |
| `list` | 200 OK | Returns paginated GRNs |
| `getById` | 200 OK | Returns single GRN with items |
| `receive` | 200 OK | Triggers full inventory update |
