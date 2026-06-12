# Accounting Module

**Location:** `src/domains/financials/accounting/`

Provides a double-entry bookkeeping system. Manages the **Chart of Accounts**, **Journal Entries** (automatic and manual), **Fiscal Year**, and **Trial Balance** reporting. This module is primarily driven by internal events from other modules (invoices, payments, expenses, payroll) rather than direct user interaction.

---

## Files

| File | Purpose |
|---|---|
| `accounting.service.ts` | Chart of accounts, journal entry posting, trial balance |
| `accounting.controller.ts` | HTTP handling (read-only endpoints) |
| `accounting.routes.ts` | Route definitions |
| `accounting.repository.ts` | Prisma queries for accounts, journals, fiscal year |
| `accounting.types.ts` | TypeScript interfaces |

---

## Routes

All routes are mounted at `/api/v1/accounting`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/accounting/accounts` | ✅ | `ACCOUNTING_VIEW` | List Chart of Accounts |
| `GET` | `/accounting/trial-balance` | ✅ | `ACCOUNTING_VIEW` | Get Trial Balance report |

Legend: ✅ = `authMiddleware`

---

## Chart of Accounts (Default Seed)

When an organization is provisioned, `seedDefaultAccounts()` creates the following system accounts:

| Code | Name | Type |
|---|---|---|
| `1000` | Cash | ASSET |
| `1010` | Bank | ASSET |
| `1200` | Accounts Receivable | ASSET |
| `1300` | Inventory | ASSET |
| `2000` | Accounts Payable | LIABILITY |
| `2100` | Tax Payable | LIABILITY |
| `3000` | Owner's Equity | EQUITY |
| `3100` | Retained Earnings | EQUITY |
| `4000` | Sales Revenue | REVENUE |
| `4100` | Other Income | REVENUE |
| `5000` | Cost of Goods Sold | EXPENSE |
| `5100` | Operating Expenses | EXPENSE |
| `5200` | Salary Expense | EXPENSE |
| `5300` | Rent Expense | EXPENSE |

---

## Service Functions (`accounting.service.ts`)

### `accountingService.seedDefaultAccounts(organizationId)`
Idempotently creates the system Chart of Accounts for a new org. Called during organization provisioning.

### `accountingService.getSystemAccount(organizationId, name)`
Retrieves a system account by name. Throws `500` if not found (config error – seed required).

### `accountingService.listAccounts(organizationId)`
Returns the full Chart of Accounts.

### `accountingService.postJournalEntry(organizationId, data)`
Validates and posts a double-entry journal:
1. Validates `totalDebit === totalCredit` (epsilon: 0.01). Throws `400` if unbalanced.
2. Validates `totalDebit > 0`.
3. Validates an active **Fiscal Year** exists. Throws `400` if none found.
4. Persists journal entry with line items.

### Automated Journal Helpers (called by other modules)

These are not exposed via HTTP – they are called internally when domain events occur:

| Helper | Triggered By | Debit | Credit |
|---|---|---|---|
| `postInvoiceJournal` | Invoice creation | AR (1200) | Revenue (4000) + Tax (2100) |
| `postPaymentJournal` | Payment recording | Cash/Bank (1000/1010) | AR (1200) |
| `postExpenseJournal` | Expense creation | Operating Exp (5100) | Cash (1000) |
| `postVendorInvoice` | Vendor invoice approval | Inventory (1300) + Tax (2100) | AP (2000) |

**Payment method routing for `postPaymentJournal`:**
- Methods `BANK_TRANSFER`, `UPI`, `CARD`, `CHEQUE` → debit account `1010` (Bank)
- All others → debit account `1000` (Cash)

### `accountingService.getTrialBalance(organizationId, filters)`
Aggregates all journal entry lines per account within an optional date range:
```typescript
{
  accounts: Array<{ accountCode, accountName, totalDebit, totalCredit }>;
  totals: {
    debit: number;
    credit: number;
    isBalanced: boolean;  // |totalDebit - totalCredit| < 0.01
  }
}
```

### `accountingService.seedFiscalYear(organizationId)`
Creates a default fiscal year (Jan 1 – Dec 31 of current year) if none exists.

---

## Types (`accounting.types.ts`)

### `CreateJournalEntryInput`
```typescript
{
  description: string;
  referenceType?: "INVOICE" | "PAYMENT" | "EXPENSE" | "VENDOR_INVOICE" | "PAYROLL" | string;
  referenceId?: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
  }>;
}
```

### `TrialBalanceFilters`
```typescript
{
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}
```

---

## Integration Points

The accounting module is integrated with:
- **Invoice module** – Calls `postInvoiceJournal` on invoice creation
- **Payment module** – Calls `postPaymentJournal` on payment recording
- **Expense module** – Calls `postExpenseJournal` on expense creation
- **Purchasing (Vendor Invoices)** – Calls `postVendorInvoice` on vendor invoice approval
- **Payroll** – Listens to `payroll.processed` event to post payroll journal entries (future)
- **Organization provisioning** – Calls `seedDefaultAccounts` and `seedFiscalYear` on org creation
