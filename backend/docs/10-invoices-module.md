# Invoices Module

**Location:** `src/modules/invoices/`

Handles customer invoices, billing cycles, line items, automatic tax calculation, and inventory integration. Invoices have a state machine (`DRAFT` → `ISSUED` → `PARTIALLY_PAID` / `PAID` / `OVERDUE`).

---

## Files

| File | Purpose |
|---|---|
| `invoice.service.ts` | Invoice generation, calculation logic, and lifecycle state changes |
| `invoice.controller.ts` | HTTP request/response handling |
| `invoice.routes.ts` | Express route definitions with permission guards |
| `invoice.repository.ts` | Complex data access and transaction orchestration |
| `invoice.types.ts` | TypeScript interfaces |
| `invoice.validators.ts` | Zod request schemas |

---

## Routes

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/invoices` | ✅ | `sales.create` | Create a new invoice (defaults to DRAFT) |
| `GET` | `/invoices` | ✅ | `sales.view` | List invoices with status/search filters |
| `GET` | `/invoices/:id` | ✅ | `sales.view` | Get specific invoice with all line items and payments |
| `PATCH` | `/invoices/:id` | ✅ | `sales.update` | Update invoice (e.g. advance status to ISSUED) |
| `DELETE` | `/invoices/:id` | ✅ | `sales.delete` | Delete a DRAFT invoice |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`invoice.types.ts`)

### `CreateInvoiceInput`
```typescript
{
  customerId: string;
  issueDate: string; // ISO datetime
  dueDate?: string;
  status?: "DRAFT" | "ISSUED";
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
  }>;
}
```

### `UpdateInvoiceInput`
```typescript
{
  status?: "DRAFT" | "ISSUED" | "CANCELLED";
  dueDate?: string;
  notes?: string;
}
```

---

## Validators (`invoice.validators.ts`)

| Schema | Validates |
|---|---|
| `createInvoiceSchema` | `body: { customerId, issueDate, dueDate?, status?, items: array min 1 { productId, quantity: positive, unitPrice?: min 0, discountAmount?: min 0 } }` |
| `updateInvoiceSchema` | `params: { id: UUID }`, `body: { status?, dueDate?, notes? }` |
| `invoiceIdParamSchema`| `params: { id: UUID }` |
| `listInvoicesSchema` | `query: { page?, limit?, status: Enum, search? }` |

---

## Service Functions (`invoice.service.ts`)

### Internal Helpers
- `formatInvoiceNumber`: Generates formatted string (e.g. `INV-000001`).
- `reserveInvoiceNumber`: Uses `invoiceSequence` table with UPSERT to ensure unique, gapless invoice numbers per organization.
- `assertCustomer`: Verifies customer exists.

### `invoiceService.createInvoice(organizationId, actorUserId, payload)`
Creates an invoice, calculates taxes and totals based on provided line items.
1. Validates customer and fetches all products referenced in `items`.
2. Computes `lineSubtotal`, `taxAmount` (from product's tax rate), `discountAmount`, and `lineTotal` for each item.
3. Computes grand totals (`subtotal`, `taxAmount`, `totalAmount`).
4. **In a transaction (`prisma.$transaction`)**:
   - Reserves invoice number.
   - Creates `invoice` record and `invoiceItem` records (`createInvoiceWithItems`).
   - If status is `ISSUED` and product is `PHYSICAL`, asserts inventory >= quantity, decrements inventory, and creates `InventoryMovement` (type `SALE`).
   - Creates a `Transaction` in the GL (type `SALE`).
   - Records `INVOICE_CREATED` audit event.
   - If `ISSUED`, adds `generate-invoice-pdf` job to BullMQ queue.
5. Returns fully populated invoice.

### `invoiceService.updateInvoice(organizationId, actorUserId, invoiceId, payload)`
Updates an invoice's status or details.
1. Validates existence via `findById` → `404` if not found.
2. **In a transaction**:
   - Updates `invoice` status, `dueDate`, `notes`.
   - If transitioning from `DRAFT` to `ISSUED`:
     - Checks inventory for all `PHYSICAL` items. Throws `400` if insufficient stock.
     - Decrements inventory and creates `SALE` inventory movements.
     - Queues `generate-invoice-pdf` job.
   - Records `INVOICE_UPDATED` audit event.
3. Returns updated invoice.

### `invoiceService.listInvoices(organizationId, filters, query)`
Lists invoices. Supports filtering by `status` and `search` (matches `invoiceNumber`).

### `invoiceService.getInvoice(organizationId, invoiceId)`
Returns invoice with relations (items, customer, payments). Throws `404` if missing.

### `invoiceService.deleteInvoice(organizationId, actorUserId, invoiceId)`
Soft-deletes an invoice.
- **Rule**: Only `DRAFT` invoices can be deleted. Throws `400` otherwise.
- Soft deletes and records `INVOICE_DELETED` audit event.

---

## Repository Functions (`invoice.repository.ts`)

Direct Prisma usage rather than `BaseRepository` due to complex nested writes and multi-entity transactions.

| Function | Description |
|---|---|
| `findById(orgId, invoiceId)` | Includes nested `items` (with `product`), `payments`, and `customer`. |
| `listInvoices(orgId, filters, query)` | Performs paginated reads and counts. Uses `mode: 'insensitive'` on `invoiceNumber`. |
| `findCustomerById(orgId, customerId)` | Looks up customer. |
| `findProductsByIds(orgId, ids)` | Bulk product fetch. |
| `createInvoiceWithItems(tx, orgId, payload)` | Uses `tx.invoice.create` and `tx.invoiceItem.createMany`. |
| `updateInvoiceForOrganization(tx, orgId, id, payload)` | Uses `updateMany` scoped to organization. |
| `decrementInventoryItem(tx, orgId, id, qty)` | Uses atomic `quantity: { decrement: quantity }`. |
| `createInventoryMovement(tx, orgId, payload)` | Hooks into inventory logs. |
| `createFinancialTransaction(tx, orgId, payload)` | Hooks into GL. |

---

## Controller Functions (`invoice.controller.ts`)

| Function | Key Behavior |
|---|---|
| `createInvoice` | Returns 201 Created with invoice data |
| `updateInvoice` | Returns 200 OK with updated invoice data |
| `listInvoices` | Returns 200 OK with paginated invoices array |
| `getInvoice` | Returns 200 OK with single invoice |
| `deleteInvoice` | Returns 200 OK with success message |
