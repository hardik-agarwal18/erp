# Vendors Module

**Location:** `src/domains/contacts/vendors/`

Manages supplier/vendor profiles. Vendors are linked to expenses and purchase orders to represent the organizations that supply goods or services.

---

## Files

| File | Purpose |
|---|---|
| `vendor.service.ts` | Business logic (CRUD, ledger aggregation) |
| `vendor.controller.ts` | HTTP request/response handling |
| `vendor.routes.ts` | Express route definitions with permission guards |
| `vendor.repository.ts` | Data access (Prisma) |
| `vendor.middleware.ts` | Module-specific middleware (`requireVendorAccess`) |
| `vendor.types.ts` | TypeScript interfaces |
| `vendor.validators.ts` | Zod request schemas |
| `index.ts` | Barrel exports |

---

## Routes

All routes are mounted at `/api/v1/vendors`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/vendors` | ✅ | `VENDORS_CREATE` | Create a new vendor |
| `GET` | `/vendors` | ✅ | `VENDORS_VIEW` | List vendors with filters |
| `GET` | `/vendors/:id` | ✅ | `VENDORS_VIEW` | Get a single vendor |
| `PATCH` | `/vendors/:id` | ✅ | `VENDORS_UPDATE` | Update vendor details |
| `DELETE` | `/vendors/:id` | ✅ | `VENDORS_UPDATE` | Soft-delete (archive) vendor |
| `GET` | `/vendors/:id/ledger` | ✅ | `VENDORS_VIEW` | Get vendor purchase ledger |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`vendor.types.ts`)

### `CreateVendorInput`
```typescript
{
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}
```

### `UpdateVendorInput`
Partial of `CreateVendorInput`.

### `VendorFilters`
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
}
```

---

## Service Functions (`vendor.service.ts`)

### `vendorService.createVendor(organizationId, actorUserId, payload)`
Creates vendor and records `VENDOR_CREATED` audit event.

### `vendorService.updateVendor(organizationId, actorUserId, vendorId, payload)`
Validates vendor exists, updates, records `VENDOR_UPDATED` audit event. Throws `404` if not found.

### `vendorService.archiveVendor(organizationId, actorUserId, vendorId)`
Soft-deletes vendor (sets `deletedAt`). Records `VENDOR_ARCHIVED` audit event.

### `vendorService.listVendors(organizationId, filters, query)`
Paginated list of non-deleted vendors.

### `vendorService.getVendor(organizationId, vendorId)`
Returns single vendor or `404`.

### `vendorService.getLedger(organizationId, vendorId)`
Returns a vendor's purchase history aggregated from the `Expense` table:
```typescript
{
  vendor: Vendor;
  purchases: Expense[];   // All expenses linked to this vendor
  payments: [];           // Placeholder (future: vendor payments)
  outstandingPayables: 0; // Placeholder (future: AP balance)
  totalPurchases: number; // Sum of expense amounts
}
```

---

## Repository Functions (`vendor.repository.ts`)

| Function | Description |
|---|---|
| `createVendor(orgId, payload)` | Inserts new Vendor record |
| `findById(orgId, id)` | Finds single vendor by ID (soft-delete safe) |
| `updateVendor(orgId, id, payload)` | Partial update |
| `archiveVendor(orgId, id)` | Sets `deletedAt = now()` |
| `listVendors(orgId, filters, query)` | Paginated search with optional `search` filter |
