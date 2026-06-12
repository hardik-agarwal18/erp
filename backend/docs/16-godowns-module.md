# Godowns Module

**Location:** `src/domains/inventory/godowns/`

Manages warehouses and storage locations (called "godowns" in Indian business terminology). All advanced inventory operations (GRN, Stock Journals, Delivery Challans, Stock Verifications) are scoped to a godown.

---

## Files

| File | Purpose |
|---|---|
| `godown.service.ts` | Business logic (CRUD) |
| `godown.controller.ts` | HTTP request/response handling |
| `godown.routes.ts` | Express route definitions |
| `godown.repository.ts` | Data access (Prisma) |
| `godown.types.ts` | TypeScript interfaces |
| `godown.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/godowns`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/godowns` | ✅ | `INVENTORY_CREATE` | Create a new godown |
| `GET` | `/godowns` | ✅ | `INVENTORY_VIEW` | List all godowns |
| `GET` | `/godowns/:id` | ✅ | `INVENTORY_VIEW` | Get a single godown |
| `PATCH` | `/godowns/:id` | ✅ | `INVENTORY_UPDATE` | Update godown details |
| `DELETE` | `/godowns/:id` | ✅ | `INVENTORY_DELETE` | Soft-delete a godown |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`godown.types.ts`)

### `CreateGodownInput`
```typescript
{
  name: string;
  code?: string;
  address?: string;
  isDefault?: boolean;
}
```

### `UpdateGodownInput`
Partial of `CreateGodownInput`.

---

## Service Functions (`godown.service.ts`)

### `godownService.create(organizationId, payload)`
Creates a new godown. If `isDefault: true`, un-marks any existing default godown for the organization first.

### `godownService.list(organizationId)`
Returns all non-deleted godowns for the org.

### `godownService.getById(organizationId, id)`
Returns a single godown or `404`.

### `godownService.update(organizationId, id, payload)`
Updates godown. Handles `isDefault` toggle same as create.

### `godownService.delete(organizationId, id)`
Soft-deletes the godown. Throws `400` if any active inventory items reference this godown.

---

## Repository Functions (`godown.repository.ts`)

| Function | Description |
|---|---|
| `create(orgId, data)` | Inserts Godown record |
| `findById(orgId, id)` | Single godown lookup |
| `findAll(orgId)` | All non-deleted godowns |
| `update(orgId, id, data)` | Partial update |
| `softDelete(orgId, id)` | Sets `deletedAt` |
| `unsetDefault(orgId)` | Clears `isDefault` on all godowns for an org |

---

## Relationships

- **GRN** – Each GRN is received into a specific godown
- **Delivery Challan** – Dispatched from a specific godown
- **Stock Journal** – Transfers from one godown to another
- **Stock Verification** – Counts are done per godown
- **InventoryItem** – One item record per `(product, godown)` pair
- **BatchInventoryItem** – One record per `(batch, godown)` pair
