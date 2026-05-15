# Sales Module Audit

## 1. Sales KPIs (Revenue, Orders, Invoices, Receivables)
**Strengths:**
- Clear top-level metrics (e.g., `InvoiceSummary`) aggregate essential data like "Overdue", "Outstanding Balance", and "Paid This Month".
**Weaknesses:**
- Heavily relies on bespoke, hardcoded summary components rather than the new modular `MetricCard` standard.
- Lacks visual trending (no sparklines or percentage growth indicators).
**UX Opportunities:**
- Convert all sales dashboards to utilize `MetricCard` grids, injecting `trend` calculations to highlight revenue growth or collection delays.

## 2. Sales Tables (Invoices, Quotes, Orders, Customers)
**Strengths:**
- Basic search and status filtering are already wired up to the view state.
**Weaknesses:**
- `InvoiceTable` and `CustomerTable` are stuck on legacy raw `Table` implementations.
- No native column visibility, sorting, or client-side pagination.
- Filters rely on native HTML `<select>` elements which clash with the design system.
**UX Opportunities:**
- Migrate all four core lists to `DataTable`.
- Implement robust faceted filtering using Shadcn popovers instead of raw `<select>` dropdowns.

## 3. Sales Workflows (Create Invoice, Convert Quote, Record Payment)
**Strengths:**
- "New Invoice" and "Customer Accounts" have prominent entry points in the `PageHeader`.
**Weaknesses:**
- Status progressions (e.g., Quote -> Invoice, or Unpaid -> Paid) require full page navigations or lack intuitive inline actions.
**UX Opportunities:**
- Introduce a "Slide-over" or "Sheet" workflow for "Record Payment", allowing users to log checks/wires without leaving the invoice list context.

## 4. UX Opportunities (Approvals, Outstanding Payments, Overdue Invoices)
**Strengths:**
- The data shape already supports explicit tracking of `balance > 0` and `overdue` statuses.
**Weaknesses:**
- Collections are currently relegated to a single passive card at the bottom of the invoice list ("Collections Focus").
**One New Recommendation:**
- **Unified Sales Action Center:** Create a dedicated, split-pane dashboard strictly for Sales Reps/AR. Utilize `AlertWidget` specifically configured for "Invoices 30+ Days Past Due" and an `ActionList` for "Quotes Awaiting Approval" to force immediate workflow resolution.
