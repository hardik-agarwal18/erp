# Accounting Redesign Proposal

## Goals
1. Standardize the `transactions`, `payments`, and `expenses` domains onto `DataTable`, `MetricCard`, `AlertWidget`, `ActionList`, and `TrendChart`.
2. Improve financial visibility via visual trends and proactive reconciliation warnings.
3. Improve ledger readability and consistency with Inventory, Sales, and Purchasing.

---

## Layout Proposal: Accounting Dashboard

### Top Row KPI Cards (`MetricCard`)
- Cash Position
- Outstanding Receivables
- Outstanding Payables
- Monthly Profit
- Monthly Expenses

### Middle Row
- **Left (`TrendChart`):** Cash Flow Trend (Visualizing money-in vs money-out over 6 months).
- **Right (`TrendChart`):** Expense Trend (Visualizing operational burn rate).

### Bottom Row
- **Alert Widget (`AlertWidget`):** Reconciliation Alerts (Flagging unmatched transactions).
- **Action List (`ActionList`):** Overdue Payments & Exceptions.

---

## Standardized Ledgers

We will upgrade the following legacy implementations to the highly interactive `DataTable` primitive:
- **Transaction Ledger:** `features/transactions/components/transaction-table.tsx`
- **Payment Ledger:** `features/payments/components/payment-table.tsx`
- **Expense Ledger:** `features/expenses/components/expense-table.tsx`
- **Reconciliation Views:** `features/transactions/components/bank-reconciliation-view.tsx`

**Features Gained:**
- Automatic client-side column sorting by amount, date, and status.
- Consistent empty state presentation matching the rest of the application.

*Note: Core accounting logic, audit trails, and the posting behavior remain completely untouched.*

---

## Filter & Status Modernization

### Filter Bar
Standardize the toolbar above all financial ledgers utilizing Shadcn components:
- Search Input (Ref/Payee)
- Account Dropdown (Operating, Payroll, Savings)
- Date Range Selector
- Status Dropdown

### Quick Status Tabs
Implement client-side tab triggers mimicking the Phase 6/7 design:
- All | Open | Cleared | Reconciled | Exception

---

## Risk Assessment

| Risk Level | Component | Concern & Mitigation |
| :--- | :--- | :--- |
| **High** | Bank Reconciliation | Side-by-side reconciliation logic is complex. Converting the matching tables to `DataTable` requires careful state preservation. Mitigation: Strictly map existing row models without changing selection logic. |
| **Medium** | Filter Bar | Translating 'Account' and 'Date Range' filters. Mitigation: Keep filters completely client-side for now, preserving existing `useMemo` hooks. |
| **Low** | Quick Status Tabs | State collision. Mitigation: Override local state gracefully. |

---

## Implementation Plan

1. **Files to Modify:**
   - `features/transactions/components/transaction-dashboard-view.tsx` (or `transaction-list-view`)
   - `features/transactions/components/transaction-table.tsx`
   - `features/transactions/components/bank-reconciliation-view.tsx`
   - `features/payments/components/payment-table.tsx`
   - `features/expenses/components/expense-table.tsx`
2. **Components to Replace:**
   - Legacy text-based summaries -> `MetricCard`
   - Native `<select>` -> Custom Filter Bar & Quick Status Tabs
3. **Components to Reuse:**
   - `DataTable`, `MetricCard`, `TrendChart`, `AlertWidget`, `ActionList`
4. **Estimated LOC Reduction:** ~200 lines by removing redundant table markup across 4 domains.
5. **Rollback Strategy:** Git revert presentation components only. No database or API layers are modified.
