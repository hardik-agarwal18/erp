# Sales Module Redesign Proposal

## Goals
1. Standardize all Sales ledgers (Invoices, Quotes, Orders, Customers) onto the `DataTable` primitive.
2. Eliminate custom summary components in favor of Phase 4 `MetricCard` arrays.
3. Streamline quote-to-cash workflows by minimizing full-page navigations.

## Layout Proposal

### 1. Sales & AR Dashboard
- **Top Row:** `MetricCard` grid for Revenue (MTD), Outstanding AR, Total Drafts, and Overdue Balance.
- **Middle Row:** Split view utilizing `TrendChart` for Revenue vs Forecast, and an `AlertWidget` highlighting Top 5 Delinquent Accounts.
- **Bottom Row:** `ActionList` targeting Quotes awaiting approval.

### 2. Standardized Ledgers (Invoices / Customers / Orders)
- **Header:** Standard `PageHeader` with primary "Create" CTA.
- **Toolbar:** Implement the new "Filter Bar" design pattern (Search input + Shadcn dropdown filters for Status/Rep).
- **Table:** Edge-to-edge `DataTable` implementation with row-click navigation to the details view.

## Component Reuse Strategy
- **`MetricCard`:** Completely replace `InvoiceSummary` and equivalent custom metric bars.
- **`DataTable`:** Deprecate `InvoiceTable`, `CustomerTable`, and `OrderTable`.
- **`AlertWidget`:** Repurpose for AR Collections targeting.

## Workflow Optimization: "Record Payment"
- Introduce a `RecordPaymentSheet` component. Instead of routing to `/invoices/[id]/payment`, clicking "Record Payment" on a `DataTable` row action will slide out a drawer, allowing the accountant to log cash/check instantly against the table context.

## Risk Assessment
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Complex Invoice Filtering** | Medium | Sales reps require complex multi-status filtering. We must ensure the `DataTable` faceted filter implementation can handle arrays of statuses (e.g., `["sent", "overdue"]`). |
| **Invoice Detail Refactor** | Low | Detail views (`invoice-details-view.tsx`) might break if we alter the underlying `Invoice` data shape to satisfy `DataTable`. We must map data cleanly without mutating the backend contracts. |
