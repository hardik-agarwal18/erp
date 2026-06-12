# Batches & Serial Numbers Modules

**Locations:**
- `src/domains/inventory/batches/`
- `src/domains/inventory/serial-numbers/`

Manage sub-unit tracking of physical inventory. **Batches** track lot/batch expiry for perishable or regulated goods. **Serial Numbers** track individual unit identity for high-value items.

---

## Batches Module (`src/domains/inventory/batches/`)

### Files

| File | Purpose |
|---|---|
| `batch.service.ts` | CRUD + listing for batches |
| `batch.controller.ts` | HTTP handling |
| `batch.routes.ts` | Route definitions |
| `batch.repository.ts` | Data access (Prisma) |
| `batch.types.ts` | TypeScript interfaces |
| `batch.validators.ts` | Zod schemas |
| `index.ts` | Barrel exports |

### Routes

All routes are mounted at `/api/v1/batches`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/batches` | ✅ | `INVENTORY_CREATE` | Create a batch manually |
| `GET` | `/batches` | ✅ | `INVENTORY_VIEW` | List batches (filterable by productId, status) |
| `GET` | `/batches/:id` | ✅ | `INVENTORY_VIEW` | Get a single batch |
| `PATCH` | `/batches/:id` | ✅ | `INVENTORY_UPDATE` | Update batch details |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

### Types

#### `CreateBatchInput`
```typescript
{
  productId: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string;
  quantity?: number;  // Initial quantity (usually 0, incremented by GRN)
}
```

### Service Logic

- **`batchService.create`**: Validates product is batch-tracked (`isBatchTracked: true`). Validates `batchNumber` uniqueness for the product. Creates batch.
- **`batchService.list`**: Paginated, filterable by `productId`, `status` (e.g. `ACTIVE`, `EXPIRED`).
- **`batchService.getById`**: Single batch with `BatchInventoryItem` details (per-godown quantities).
- **`batchService.update`**: Allows updating `expiryDate`, `manufactureDate`.

> **Automatic batch creation**: When a GRN item has `batchMode: "CREATE_NEW"`, the GRN service creates the batch automatically. The `/batches` endpoint is for manual management.

---

## Serial Numbers Module (`src/domains/inventory/serial-numbers/`)

### Files

| File | Purpose |
|---|---|
| `serial-number.service.ts` | CRUD + status management |
| `serial-number.controller.ts` | HTTP handling |
| `serial-number.routes.ts` | Route definitions |
| `serial-number.repository.ts` | Data access (Prisma) |
| `serial-number.types.ts` | TypeScript interfaces |
| `serial-number.validators.ts` | Zod schemas |

### Routes

All routes are mounted at `/api/v1/serial-numbers`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/serial-numbers` | ✅ | `INVENTORY_VIEW` | List serial numbers (filterable by productId, godownId, status) |
| `GET` | `/serial-numbers/:id` | ✅ | `INVENTORY_VIEW` | Get a single serial number |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

> **Note:** Serial numbers are created automatically by the GRN `receive` flow, and their status is updated by Delivery Challan `dispatch` and Stock Verification `complete`. Direct creation via the API is read-only.

### Serial Number Status Lifecycle

```
AVAILABLE → SOLD        (Delivery Challan dispatch)
AVAILABLE → MISSING     (Stock Verification – physically absent)
MISSING   → AVAILABLE   (Stock Verification – found again)
```

### Types

#### `SerialNumberFilters`
```typescript
{
  productId?: string;
  godownId?: string;
  status?: "AVAILABLE" | "SOLD" | "MISSING";
  page?: number;
  limit?: number;
}
```

---

## Stock Groups Module (`src/domains/inventory/stock-groups/`)

Manages hierarchical product groupings (e.g., "Electronics > Laptops") for reporting and categorization. Routes are at `/api/v1/stock-groups`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/stock-groups` | ✅ | `INVENTORY_CREATE` | Create a stock group |
| `GET` | `/stock-groups` | ✅ | `INVENTORY_VIEW` | List all stock groups |
| `GET` | `/stock-groups/:id` | ✅ | `INVENTORY_VIEW` | Get single group with children |
| `PATCH` | `/stock-groups/:id` | ✅ | `INVENTORY_UPDATE` | Update group |
| `DELETE` | `/stock-groups/:id` | ✅ | `INVENTORY_DELETE` | Soft-delete group |

**Key logic:** Cannot delete a stock group that has active sub-groups or products assigned to it.
