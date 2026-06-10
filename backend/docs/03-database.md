# Database Layer

All database files are in `src/database/`.

---

## `prisma.ts` – Prisma Client Factory

### `createPrismaClient(): PrismaClient`
Creates a Prisma client with:
- Environment-aware `DATABASE_URL` (uses `TEST_DATABASE_URL` in test mode)
- Query logging in development (duration, params, query)
- Error event logging
- Global singleton pattern to survive hot reload in development

### `connectDatabase(): Promise<void>`
Opens the DB connection exactly once per process lifecycle. Uses a dedup promise to prevent concurrent connection attempts.

### `disconnectDatabase(): Promise<void>`
Safely closes the Prisma connection pool.

### `registerDatabaseShutdownHooks(): void`
Registers process-level `SIGINT`/`SIGTERM` handlers (once) to disconnect Prisma on shutdown.

---

## `extensions.ts` – Prisma Extensions (Tenant Scoping & Soft Deletes)

The heart of the multi-tenancy system. Creates a Prisma client extension that transparently handles:

### Database Request Context

```typescript
type DatabaseRequestContext = {
  actorUserId?: string;
  bypassTenant?: boolean;
  includeDeleted?: boolean;
  organizationId?: string;
};
```

Uses `AsyncLocalStorage` to propagate context through the call stack.

### `runWithDatabaseContext<T>(context, callback): Promise<T>`
Runs a callback within a tenant and actor-aware database context.

### `getDatabaseContext(): DatabaseRequestContext`
Returns the current request-scoped context.

### Tenant-Owned Models
Models that are automatically scoped by `organizationId`:
`AuditLog`, `Customer`, `Expense`, `InventoryItem`, `InventoryMovement`, `Invitation`, `Invoice`, `InvoiceSequence`, `OrganizationMember`, `Payment`, `Product`, `ProductCategory`, `Role`, `Tax`, `Transaction`, `Vendor`

### Soft-Delete Models
Models that use `deletedAt` instead of hard deletion:
`Customer`, `Expense`, `InventoryItem`, `Invoice`, `Payment`, `Product`, `ProductCategory`, `Tax`, `Vendor`

### Query Interceptors (Automatic Behavior)

| Operation | Tenant Scoping | Soft Delete Filter | Actor Metadata |
|---|---|---|---|
| `create` | Sets `organizationId` | — | Sets `createdBy` |
| `createMany` | Sets `organizationId` on each | — | Sets `createdBy` on each |
| `findMany` / `findFirst` | Adds `WHERE organizationId =` | Adds `WHERE deletedAt IS NULL` | — |
| `findUnique` | Validates scoped access | Filters deleted records | — |
| `update` | Validates scoped access | — | Sets `updatedBy`, `updatedAt` |
| `updateMany` | Adds `WHERE organizationId =` | Filters deleted records | Sets `updatedBy`, `updatedAt` |
| `delete` | Validates scoped access | Converts to soft-delete (`SET deletedAt`) | Sets `updatedBy` |
| `deleteMany` | Adds tenant filter | Converts to `updateMany` with `deletedAt` | — |
| `aggregate` / `count` / `groupBy` | Adds tenant filter | Adds `deletedAt IS NULL` | — |

### Model Helper Methods

#### `softDelete(where)` 
Soft-deletes a record by setting `deletedAt = new Date()`. Only available on soft-delete models.

#### `restore(where)`
Restores a soft-deleted record by setting `deletedAt = null`. Looks up records including deleted ones.

### Helper Functions

| Function | Description |
|---|---|
| `isTenantOwnedModel(name)` | Checks if a model is tenant-scoped |
| `isSoftDeleteModel(name)` | Checks if a model supports soft deletes |
| `assertTenantData(data, orgId, model)` | Validates and injects `organizationId` on writes |
| `mergeTenantWhere(where, orgId)` | Adds `organizationId` to WHERE clause |
| `mergeSoftDeleteWhere(where)` | Adds `deletedAt: null` to WHERE clause |

---

## `base.repository.ts` – Generic Repository

### `BaseRepository<TRecord, TCreate, TUpdate>`
Reusable CRUD primitive for `id`-based models.

**Constructor Options:**
| Option | Type | Default | Description |
|---|---|---|---|
| `idField` | `string` | `"id"` | Primary key field name |
| `softDelete` | `boolean` | `false` | Enable soft-delete filtering |
| `tenantScoped` | `boolean` | `false` | Enable org scoping |

**Methods:**
| Method | Description |
|---|---|
| `create(data)` | Create a new record |
| `findById(id, organizationId?, includeDeleted?)` | Find by ID with scoping |
| `list(where?, options?, organizationId?, includeDeleted?)` | List with pagination |
| `count(where?, organizationId?, includeDeleted?)` | Count matching records |
| `updateById(id, data, organizationId?)` | Update by ID (checks existence first) |
| `archiveById(id, organizationId?)` | Soft-delete (sets `deletedAt`) |
| `restoreById(id, organizationId?)` | Restore soft-deleted record |

---

## `transactions.ts` – ACID Transaction Helpers

### `DEFAULT_TRANSACTION_OPTIONS`
Shared config for ERP write transactions:
- `isolationLevel: Serializable`
- `maxWait: 5000ms`
- `timeout: 15000ms`

### `withTransaction<T>(callback): Promise<T>`
Executes a callback in a single ACID transaction with enterprise-safe defaults.

### `createInvoiceAndPayment(input): Promise<{invoice, payment, transaction}>`
Atomic creation of:
1. Invoice with line items
2. Payment record
3. Financial transaction
- Auto-determines invoice status (PAID/PARTIALLY_PAID/ISSUED)
- Validates payment doesn't exceed invoice total

### `createProductAndInventory(input): Promise<{product, inventoryItem, movement}>`
Atomic creation of:
1. Product record
2. Inventory item (ledger)
3. Opening stock movement (if initial quantity > 0)

### `createOrganizationAndOwner(input): Promise<{owner, organization, ownerRole, membership}>`
Atomic creation of:
1. User account
2. Organization
3. Owner role
4. Membership linking user → org → role
5. Invoice sequence (INV-000001)
6. Audit log entry

---

## `seed.ts` – Database Seeding

### `seedDatabase(): Promise<void>`
Seeds the baseline ERP tenant with:
1. **All permissions** from the `PERMISSIONS` constant
2. **Super admin user** (configurable via env vars)
3. **Default organization** with slug `default-organization`
4. **System roles**: `SUPER_ADMIN`, `owner`, `admin`, `manager`, `member`
5. **Role-permission assignments** based on RBAC matrix
6. **Invoice sequence** for the default org
7. **Audit log** for seed completion

**Environment Overrides:**
| Env Var | Default |
|---|---|
| `SEED_SUPER_ADMIN_EMAIL` | `superadmin@erp.local` |
| `SEED_SUPER_ADMIN_NAME` | `ERP Super Admin` |
| `SEED_SUPER_ADMIN_PASSWORD` | `ChangeMe123!` |
| `SEED_DEFAULT_ORGANIZATION_SLUG` | `default-organization` |
