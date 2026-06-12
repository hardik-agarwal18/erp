# Inventory Module (Core)

**Location:** `src/domains/inventory/inventory/`

Tracks stock levels, movements, and manual adjustments at the product level (non-godown-aware). This is the _legacy_ core inventory module that predates the godown-aware architecture. New operations (GRN, Journals, Challans) use godown-scoped `InventoryItem` records directly.

---

## Files

| File | Purpose |
|---|---|
| `inventory.service.ts` | Stock adjustment/transfer logic with Prisma transactions |
| `inventory.controller.ts` | HTTP request/response handling |
| `inventory.routes.ts` | Express route definitions with permission guards |
| `inventory.repository.ts` | Data access for `InventoryItem`, `InventoryMovement`, `Transaction` |
| `inventory.types.ts` | TypeScript interfaces for payloads |
| `inventory.validators.ts` | Zod request schemas |

---

## Routes

All routes are mounted at `/api/v1/inventory`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/inventory/items` | ✅ | `inventory.view` | List stock items with product relations |
| `GET` | `/inventory/items/:productId` | ✅ | `inventory.view` | Get stock for specific product |
| `GET` | `/inventory/movements` | ✅ | `inventory.view` | List inventory movement logs |
| `POST` | `/inventory/adjustments` | ✅ | `inventory.update` | Adjust stock manually |
| `POST` | `/inventory/transfers` | ✅ | `inventory.update` | Transfer stock (decrements inventory item) |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

> **Note:** The idempotency middleware is applied globally to this route group in `app.ts`.

---

## Types (`inventory.types.ts`)

### `StockAdjustmentInput`
```typescript
{
  productId: string; // UUID
  quantity: number;  // Can be negative (deduction) or positive (addition)
  referenceId?: string;
}
```

### `StockTransferInput`
```typescript
{
  productId: string; // UUID
  quantity: number;  // Must be positive
  referenceId?: string;
}
```

### `InventoryFilters`
```typescript
{
  productId?: string;
  search?: string;
}
```

---

## Validators (`inventory.validators.ts`)

| Schema | Validates |
|---|---|
| `adjustStockSchema` | `body: { productId: UUID, quantity: number, referenceId?: max 120 chars }` |
| `transferStockSchema` | `body: { productId: UUID, quantity: positive number, referenceId?: max 120 chars }` |
| `listInventoryItemsSchema` | `query: { page?, limit?, search? }` |
| `listInventoryMovementsSchema` | `query: { page?, limit?, productId? }` |

---

## Service Functions (`inventory.service.ts`)

### Internal Helpers
- `assertPhysicalProduct(organizationId, productId)`: Verifies the product exists and `type === "PHYSICAL"`. Throws `400` if it's a SERVICE product.

### `inventoryService.listItems(organizationId, filters, query)`
Retrieves paginated stock on hand for the organization's physical products. Includes product details.

### `inventoryService.listMovements(organizationId, productId, query)`
Retrieves logs of all inventory movements. Can be filtered by `productId`.

### `inventoryService.adjustStock(organizationId, actorUserId, payload)`
Performs a manual stock adjustment.
1. Asserts product is `PHYSICAL`.
2. **In a transaction (`prisma.$transaction`)**:
   - Finds existing `InventoryItem` with exclusive lock (`findInventoryItemForUpdate`).
   - If not exists and adjusting positively: creates item.
   - If adjusting negatively below zero: throws `400` "Insufficient stock".
   - Updates item quantity (`incrementInventoryItem`).
   - Creates an `InventoryMovement` log (type: `ADJUSTMENT`).
   - Creates a `Transaction` in the GL to reflect financial change (`PURCHASE` or `SALE` depending on quantity sign).
   - Records `INVENTORY_ADJUSTED` audit event.
3. Returns updated item and movement log.

### `inventoryService.transferStock(organizationId, actorUserId, payload)`
Logs a transfer out of inventory.
1. Asserts product is `PHYSICAL`.
2. **In a transaction (`prisma.$transaction`)**:
   - Acquires exclusive lock on item via `findInventoryItemForUpdate`.
   - Asserts quantity >= payload.quantity → `400` if insufficient.
   - Decrements stock quantity via `decrementInventoryItem`.
   - Creates `InventoryMovement` log (type: `TRANSFER`).
   - Records `INVENTORY_TRANSFERRED` audit event.
3. Returns updated item and movement log.

---

## Repository Functions (`inventory.repository.ts`)

Direct Prisma queries rather than using `BaseRepository` due to the need for atomic locking and multi-model transactions. Passes `tx` client explicitly for transaction safety.

| Function | Description |
|---|---|
| `findInventoryItemForUpdate(tx, orgId, productId)` | Finds an item within a transaction context. Acts as a lock. |
| `incrementInventoryItem(tx, orgId, id, qty)` | Uses atomic `quantity: { increment: quantity }` |
| `decrementInventoryItem(tx, orgId, id, qty)` | Uses atomic `quantity: { decrement: quantity }` |
| `createInventoryMovement(tx, orgId, payload)` | Logs the stock change |
| `createFinancialTransaction(tx, orgId, payload)` | Hooks into General Ledger (Transactions) |
| `listItems(orgId, filters, query)` | Performs paginated reads and counts for Items. |
| `listMovements(orgId, productId, query)` | Performs paginated reads and counts for Movements. |

---

## Controller Functions (`inventory.controller.ts`)

| Function | Key Behavior |
|---|---|
| `listItems` | Returns 200 OK with paginated items |
| `getItem` | Fetches using `listItems` with `limit: 1`. Returns 200 OK with single item or 404 |
| `listMovements` | Returns 200 OK with paginated movement logs |
| `adjustStock` | Returns 201 Created with `{ item, movement }` |
| `transferStock` | Returns 200 OK with `{ item, movement }` |

---

## Related Modules

For more advanced inventory operations, see:
- [Godowns Module](./15-godowns-module.md) – Warehouse management
- [GRN Module](./16-grn-module.md) – Goods receipt with godown-awareness
- [Delivery Challans Module](./17-delivery-challans-module.md) – Dispatch with serial/batch tracking
- [Stock Journals Module](./18-stock-journals-module.md) – Inter-godown transfers
- [Stock Verifications Module](./19-stock-verifications-module.md) – Physical count & variance reconciliation
