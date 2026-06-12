# Stock Verifications Module

**Location:** `src/domains/inventory/stock-verifications/`

Handles physical stock count (stocktaking) for a specific godown. A verification is created with expected quantities pulled from the system. During completion, the recorder enters actual physical counts. Any variance (physical - expected) is automatically reconciled as an inventory adjustment. Supports batch-tracked and serial-tracked products.

---

## Files

| File | Purpose |
|---|---|
| `stock-verification.service.ts` | Create + complete logic with variance reconciliation |
| `stock-verification.controller.ts` | HTTP request/response handling |
| `stock-verification.routes.ts` | Express route definitions |
| `stock-verification.repository.ts` | Data access (Prisma) |
| `stock-verification.types.ts` | TypeScript interfaces |
| `stock-verification.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/stock-verifications`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/stock-verifications` | ✅ | `INVENTORY_CREATE` | Create a new verification sheet |
| `GET` | `/stock-verifications` | ✅ | `INVENTORY_VIEW` | List verifications |
| `GET` | `/stock-verifications/:id` | ✅ | `INVENTORY_VIEW` | Get a single verification |
| `POST` | `/stock-verifications/:id/complete` | ✅ | `INVENTORY_UPDATE` | Complete & reconcile variances |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`stock-verification.types.ts`)

### `CreateStockVerificationInput`
```typescript
{
  verificationNumber: string;
  godownId: string;
  date: string;
  notes?: string;
  items: Array<{
    productId: string;
    expectedQty: number;
    batchId?: string;
  }>;
}
```

### `CompleteStockVerificationInput`
```typescript
{
  items: Array<{
    id: string;            // StockVerificationItem.id
    physicalQty: number;   // Actual counted quantity
    missingSerialIds?: string[];    // Serial IDs physically missing
    foundSerialNumbers?: string[];  // Serial numbers found but not in system
  }>;
}
```

### `StockVerificationFilters`
```typescript
{
  status?: string;
  godownId?: string;
}
```

---

## Service Functions (`stock-verification.service.ts`)

### `verificationService.create(organizationId, actorUserId, payload)`
Creates a verification sheet:
1. Validates `verificationNumber` uniqueness.
2. Validates `godownId` exists.
3. Persists via repository.
4. Records `VERIFICATION_CREATED` audit event.

### `verificationService.complete(id, organizationId, actorUserId, payload)`
Completes the stock count and reconciles variances. **All inside `prisma.$transaction`**:
1. Validates verification exists and is not already `COMPLETED`.
2. For each input item:
   - Calculates `varianceQty = physicalQty - expectedQty`.
   - Updates `StockVerificationItem.physicalQty` and `varianceQty`.
   - **If `varianceQty !== 0`** (discrepancy found):
     - For **non-serial** products: creates or updates `InventoryItem` and `BatchInventoryItem` by `varianceQty` (can be positive or negative). Creates an `InventoryMovement` (type: `ADJUSTMENT`).
     - For **serial-tracked** products:
       - Marks each `missingSerialId` as `status = "MISSING"`. Creates a negative `InventoryMovement`.
       - For each `foundSerialNumber`: creates or recovers a `SerialNumber` record (status: `AVAILABLE`). Creates a positive `InventoryMovement`.
3. Sets verification `status = "COMPLETED"` and `completedDate = now()`.
4. Records `VERIFICATION_COMPLETED` audit event.

---

## Repository Functions (`stock-verification.repository.ts`)

| Function | Description |
|---|---|
| `create(orgId, data)` | Creates verification + items |
| `findById(id, orgId)` | Fetches verification with items |
| `list(orgId, filters, query)` | Paginated listing |
| `findByVerificationNumber(num, orgId)` | Uniqueness check |
