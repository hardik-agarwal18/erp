# Purchases Module (Vendors & Expenses)

**Locations:** `src/modules/vendors/`, `src/modules/expenses/`

Manages vendors (suppliers), tracks operational expenses, and maintains vendor ledgers (purchase history).

---

## Files

| File | Purpose |
|---|---|
| `vendor.service.ts` / `expense.service.ts` | Business logic, transaction orchestration, auditing |
| `vendor.controller.ts` / `expense.controller.ts` | HTTP request/response handling |
| `vendor.routes.ts` / `expense.routes.ts` | Express route definitions with permission guards |
| `vendor.repository.ts` / `expense.repository.ts` | Data access via Prisma / BaseRepository |
| `vendor.types.ts` / `expense.types.ts` | TypeScript interfaces for payloads |
| `vendor.validators.ts` / `expense.validators.ts` | Zod request schemas |

---

## Vendor Routes

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/vendors` | ✅ | `vendors.create` | Create a new vendor |
| `GET` | `/vendors` | ✅ | `vendors.view` | List vendors with search |
| `GET` | `/vendors/:id` | ✅ | `vendors.view` | Get specific vendor |
| `PATCH` | `/vendors/:id` | ✅ | `vendors.update` | Update vendor details |
| `DELETE` | `/vendors/:id` | ✅ | `vendors.update` | Soft-delete/Archive vendor |
| `GET` | `/vendors/:id/ledger` | ✅ | `vendors.view` | View vendor ledger (purchases vs payments) |

## Expense Routes

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/expenses` | ✅ | `finance.create` | Record an expense |
| `GET` | `/expenses` | ✅ | `finance.view` | List expenses (filterable by vendor/category) |
| `GET` | `/expenses/:id` | ✅ | `finance.view` | View specific expense |
| `PATCH` | `/expenses/:id` | ✅ | `finance.update` | Update expense |
| `DELETE` | `/expenses/:id` | ✅ | `finance.delete` | Delete expense |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`vendor.types.ts` / `expense.types.ts`)

### `CreateVendorInput`
```typescript
{
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
}
```

### `CreateExpenseInput`
```typescript
{
  vendorId?: string;
  category: string;
  amount: number;
  expenseDate: string; // ISO datetime
  description?: string;
}
```

---

## Validators (`vendor.validators.ts` / `expense.validators.ts`)

| Schema | Validates |
|---|---|
| `createVendorSchema` | `body: { name: 2-120 chars, email, phone, gstNumber, address }` |
| `listVendorsSchema` | `query: { page?, limit?, search? }` |
| `createExpenseSchema` | `body: { vendorId: UUID?, category: max 120 chars, amount: positive number, expenseDate: valid datetime, description: max 500 chars }` |
| `listExpensesSchema` | `query: { page?, limit?, category?, vendorId?, startDate?, endDate? }` |

---

## Service Functions

### Vendors (`vendor.service.ts`)
- `createVendor`: Uses `vendorRepository`. Logs `VENDOR_CREATED` audit event.
- `updateVendor`: Checks existence. Updates via repo. Logs `VENDOR_UPDATED`.
- `archiveVendor`: Uses repo to soft-delete. Logs `VENDOR_ARCHIVED`.
- `getLedger`: Retrieves financial history for a vendor.
  - **Transaction**: Fetches all active `expenses` for the vendor and an aggregate `SUM(amount)`.
  - Returns `vendor`, `purchases` list, and `totalPurchases`.

### Expenses (`expense.service.ts`)
- `createExpense(organizationId, actorUserId, payload)`:
  1. Validates `vendorId` existence if provided.
  2. **In a transaction (`prisma.$transaction`)**:
     - Creates the `expense` record.
     - Automatically creates a `Transaction` in the GL with `type = "EXPENSE"`, linking it via `referenceId`.
     - Logs `EXPENSE_CREATED` audit event.
     - Logs via application logger (`logger.info`).
- `updateExpense`: Updates Prisma directly. Logs `EXPENSE_UPDATED` audit event and app logger.
- `deleteExpense`: Soft-deletes. Logs `EXPENSE_DELETED` audit event.
- `listExpenses`: Calls repo with filters for `category`, `vendorId`, `startDate`, `endDate`.

---

## Repository Functions (`vendor.repository.ts` / `expense.repository.ts`)

| Function | Description |
|---|---|
| `vendor.createVendor` | Maps input to BaseRepository create payload |
| `vendor.listVendors` | Paginated search (insensitive match on name, email, phone, gstNumber) |
| `expense.listExpenses` | Paginated filter logic combining date ranges, vendor IDs, and categories |

---

## Controller Functions (`vendor.controller.ts` / `expense.controller.ts`)

| Function | Key Behavior |
|---|---|
| `createVendor` / `createExpense` | Returns 201 Created |
| `listVendors` / `listExpenses` | Returns 200 OK with paginated array |
| `getVendor` / `getExpenseById` | Returns 200 OK with object |
| `updateVendor` / `updateExpense` | Returns 200 OK with updated object |
| `archiveVendor` / `deleteExpense` | Returns 200 OK with success message |
| `getLedger` | Returns 200 OK with complex vendor ledger aggregate |
