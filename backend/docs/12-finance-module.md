# Finance Module (Transactions, Payments, Taxes & Expenses)

**Locations:**
- `src/domains/financials/transactions/`
- `src/domains/financials/payments/`
- `src/domains/financials/taxes/`
- `src/domains/financials/expenses/`

Manages financial tracking: transactions (General Ledger entries read-only view), incoming/outgoing payments against invoices, dynamic tax rules, and expense recording.

> **Related modules:** Double-entry accounting (Chart of Accounts, Journal Entries, Trial Balance) is documented in [22-accounting-module.md](./22-accounting-module.md). Purchasing (Purchase Orders, Vendor Invoices) is in [29-purchasing-module.md](./29-purchasing-module.md).

---

## Files

| File | Purpose |
|---|---|
| `transaction.service.ts` | Read-only ledger transaction retrieval |
| `payment.service.ts` | Processing/recording payments and advancing invoice states |
| `tax.service.ts` | Tax rates creation and default toggling |
| `*.controller.ts` | HTTP request/response handling |
| `*.routes.ts` | Express route definitions with permission guards |
| `*.repository.ts` | Data access (Prisma / BaseRepository) |
| `*.types.ts` | TypeScript interfaces for payloads |
| `*.validators.ts` | Zod schemas |

---

## Routes

### Transactions
| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/transactions` | ✅ | `finance.view` | List transactions with filters |
| `GET` | `/transactions/:id` | ✅ | `finance.view` | Get specific transaction details |

### Payments
| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/payments` | ✅ | `finance.create` | Record a new payment against an invoice |
| `GET` | `/payments` | ✅ | `finance.view` | List payments (optionally filtered by invoiceId) |
| `DELETE` | `/payments/:id` | ✅ | `finance.delete` | Soft-delete a payment |

### Taxes
| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/taxes` | ✅ | `finance.create` | Create a new tax rate |
| `GET` | `/taxes` | ✅ | `finance.view` | List tax rates |
| `GET` | `/taxes/:id` | ✅ | `finance.view` | Get specific tax details |
| `PATCH` | `/taxes/:id` | ✅ | `finance.update` | Update tax rate (including making it default) |
| `DELETE` | `/taxes/:id` | ✅ | `finance.delete` | Archive a tax rate |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types & Validators

### Payments
**`CreatePaymentInput`**
```typescript
{
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string; // ISO datetime
  reference?: string;
  notes?: string;
}
```
**`createPaymentSchema`**: `body: { invoiceId: UUID, amount: number, paymentMethod: max 50 chars, paymentDate, reference?, notes? }`

### Taxes
**`CreateTaxInput`**
```typescript
{
  name: string;
  rate: number;
  type: "PERCENTAGE" | "FIXED";
  isDefault?: boolean;
}
```
**`createTaxSchema`**: `body: { name: 2-50 chars, rate: min 0, type: Enum, isDefault?: boolean }`

---

## Service Functions

### Transactions (`transaction.service.ts`)
- **Note:** Transactions are purely read-only from the API layer. They are strictly created internally by other modules (Invoices, Payments, Expenses, Inventory adjustments).
- `listTransactions`: Paginated/filtered read.
- `getTransaction`: Single read.

### Payments (`payment.service.ts`)
- `createPayment(organizationId, actorUserId, payload)`:
  1. Validates `invoiceId`.
  2. **In a transaction (`prisma.$transaction`)**:
     - Creates the `payment` record.
     - Aggregates all payments for the invoice (`sumPaymentsForInvoice`) to compute `totalPaid`.
     - Throws `400` if `totalPaid > invoice.totalAmount`.
     - Automatically resolves and updates the invoice `status` (`PARTIALLY_PAID` or `PAID`).
     - Creates a `Transaction` in the GL of type `PAYMENT` or `REFUND`.
     - Records `PAYMENT_CREATED` audit event.
- `listPayments`, `deletePayment`: Standard CRUD wrappers with auditing.

### Taxes (`tax.service.ts`)
- `enforceDefaultTax`: Internal helper. If a tax is marked `isDefault: true`, this automatically updates `isDefault: false` on all other taxes for the organization.
- `createTax`: Creates tax. Calls `enforceDefaultTax` if needed. Logs `TAX_CREATED`.
- `updateTax`: Updates tax. Calls `enforceDefaultTax` if needed. Logs `TAX_UPDATED`.
- `archiveTax`: Soft-deletes tax. Logs `TAX_ARCHIVED`.

---

## Controller Functions

| Module | Function | Key Behavior |
|---|---|---|
| **Transactions** | `listTransactions`, `getTransaction` | Returns 200 OK |
| **Payments** | `createPayment` | Returns 201 Created |
| **Payments** | `listPayments`, `deletePayment` | Returns 200 OK |
| **Taxes** | `createTax` | Returns 201 Created |
| **Taxes** | `listTaxes`, `getTax`, `updateTax`, `archiveTax` | Returns 200 OK |
