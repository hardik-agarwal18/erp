# Design Consistency Audit

## Global Component Usage Validation

We audited the entire ERP application to confirm the strict implementation of our five core design primitives: `MetricCard`, `TrendChart`, `DataTable`, `ActionList`, and `AlertWidget`.

### 1. Dashboard (Core)
- **Status:** Standardized.
- Uses all 5 core primitives natively.
- No legacy HTML tables remain.

### 2. Inventory Module
- **Status:** Standardized.
- KPI grid fully converted to `MetricCard`.
- `InventoryItemsTable` upgraded to `DataTable`.
- Alert/Queue lists modernized to `AlertWidget` and `ActionList`.
- Filter Bar successfully implemented.

### 3. Sales Module
- **Status:** Standardized.
- `MetricCard` integration successful.
- `InvoiceTable`, `OrderTable`, `CustomerTable`, and `QuoteTable` upgraded to `DataTable`.
- Filter Bar and Quick Status Tabs successfully implemented.

### 4. Purchasing Module
- **Status:** Standardized.
- `PurchaseTable`, Vendor POs, and GRNs all utilize `DataTable`.
- `PurchaseListView` functions as a robust Dashboard utilizing `TrendChart` and Custom `AlertWidget` displays (Vendor Performance).

### 5. Accounting Module
- **Status:** Standardized (with one exception).
- `TransactionTable`, `ExpenseTable`, and `PaymentTable` utilize `DataTable`.
- **Exception:** `BankReconciliationView` retains its legacy `<Table>` markup due to the complexity of its side-by-side matching UX. 

### 6. Reports Module
- **Status:** Standardized.
- Legacy static cards replaced by a fully interactive `DataTable` Catalog.
- Metrics added via `MetricCard`. Export tracking moved to `ActionList`.

### 7. Settings
- **Status:** Partial.
- User management tables rely on `DataTable`.
- **Exception:** General settings forms heavily rely on native HTML `<select>` inputs rather than custom Shadcn `Select` components.

---

## Remaining Technical Debt & Inconsistencies

1. **Legacy Tables:**
   - The Bank Reconciliation View (`bank-reconciliation-view.tsx`) is the final remaining legacy HTML `<Table>` in the entire application.
2. **Native Selects:**
   - Some legacy module forms (e.g., Settings, new creation workflows) bypass the Shadcn `<Select>` component for native `<select>` tags, leading to dropdowns that break dark mode styling.
3. **Hardcoded Colors:**
   - While major dashboards were stripped of hardcoded hex values, some specialized SVGs and standalone icons may still carry hardcoded tailwind classes (e.g., `text-green-500`) instead of semantic tokens (`text-success`).
4. **Inconsistent Loading States:**
   - While `DashboardSkeleton` handles the primary dashboard well, deeply nested module pages rely on standard CSS spinners (`Loader2`) rather than dedicated skeleton structures, causing minor layout shifts.
