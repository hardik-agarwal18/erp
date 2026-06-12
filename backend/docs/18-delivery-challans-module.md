# Delivery Challans Module

**Location:** `src/domains/inventory/delivery-challans/`

Handles outbound dispatch of goods from a godown. A Delivery Challan is created in `DRAFT` status and then dispatched, at which point inventory is decremented and serial numbers are marked as `SOLD`. Supports batch-tracked and serial-tracked products.

---

## Files

| File | Purpose |
|---|---|
| `delivery-challan.service.ts` | Create + dispatch logic with transactional inventory deduction |
| `delivery-challan.controller.ts` | HTTP request/response handling |
| `delivery-challan.routes.ts` | Express route definitions |
| `delivery-challan.repository.ts` | Data access (Prisma) |
| `delivery-challan.types.ts` | TypeScript interfaces |
| `delivery-challan.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/delivery-challans`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/delivery-challans` | ✅ | `INVENTORY_CREATE` | Create a new challan (DRAFT) |
| `GET` | `/delivery-challans` | ✅ | `INVENTORY_VIEW` | List challans with filters |
| `GET` | `/delivery-challans/:id` | ✅ | `INVENTORY_VIEW` | Get a single challan |
| `POST` | `/delivery-challans/:id/dispatch` | ✅ | `INVENTORY_UPDATE` | Dispatch a DRAFT challan |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`delivery-challan.types.ts`)

### `CreateDeliveryChallanInput`
```typescript
{
  challanNumber: string;
  customerId?: string;
  deliveryDate: string;
  godownId: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    batchId?: string;
  }>;
}
```

### `DeliveryChallanFilters`
```typescript
{
  status?: string;
  customerId?: string;
  godownId?: string;
}
```

---

## Service Functions (`delivery-challan.service.ts`)

### `challanService.create(organizationId, actorUserId, payload)`
Creates a DRAFT challan:
1. Validates `challanNumber` uniqueness.
2. Validates `godownId` exists.
3. Persists via repository.
4. Records `CHALLAN_CREATED` audit event.

### `challanService.dispatch(id, organizationId, actorUserId, payload?)`
Dispatches a DRAFT challan. **All operations inside `prisma.$transaction`**:
1. Validates challan exists and is in `DRAFT` status.
2. For each challan item:
   - Validates batch assigned for batch-tracked products.
   - Requires `serialNumberIds[]` matching `quantity` for serial-tracked products.
   - Checks `InventoryItem.quantity >= item.quantity`. Throws `400 Insufficient stock` if not.
   - Checks `BatchInventoryItem.quantity >= item.quantity` for batch items.
   - **Decrements `InventoryItem.quantity`**.
   - **Decrements `BatchInventoryItem.quantity`** and global `Batch.quantity` for batch items.
   - For serial items: updates each `SerialNumber.status = "SOLD"` and sets `soldDate`. Creates individual `InventoryMovement` records (type: `CHALLAN_ISSUE`, qty: `-1`).
   - For non-serial items: creates a single `InventoryMovement` (type: `CHALLAN_ISSUE`, qty: `-item.quantity`).
3. Sets challan `status = "COMPLETED"`.
4. Records `CHALLAN_DISPATCHED` audit event.

---

## Repository Functions (`delivery-challan.repository.ts`)

| Function | Description |
|---|---|
| `create(orgId, data)` | Creates challan + items |
| `findById(id, orgId)` | Fetches challan with items |
| `list(orgId, filters, query)` | Paginated listing |
| `findByChallanNumber(num, orgId)` | Uniqueness check |
