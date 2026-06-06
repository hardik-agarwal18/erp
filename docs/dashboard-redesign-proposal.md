# Dashboard Redesign Proposal

## Overview
The goal of this redesign is to provide a multi-persona view that caters equally to Executives (high-level metrics), Accountants (cash flow, payables), and Operations (inventory alerts, pending actions).

## Wireframe Description

### Top Row (KPIs)
A fluid grid of 4 to 6 metric cards spanning the full width.
- **Metrics:** Total Revenue, Operating Expenses, Net Margin, Outstanding Receivables, Cash in Bank, Pending Approvals.
- **Visuals:** Large typography, percentage change badges, and subtle background sparklines.

### Second Row (Financial Trends)
A 50/50 split of wide metric charts.
- **Left:** Revenue Trends (Line/Area Chart showing actuals vs. forecast).
- **Right:** Expense Trends (Bar Chart splitting payroll vs. operating expenses).

### Third Row (Operational Awareness)
A 60/40 or 50/50 split focusing on immediate workflow items.
- **Left:** Pending Actions (Actionable list: "Review 3 Draft Invoices", "Approve 1 Stock Transfer").
- **Right:** Recent Activity (Clickable audit log feed of the latest user actions across the ERP).

### Fourth Row (Operational Summaries)
A multi-column grid containing module-specific alerts.
- **Column 1:** Low Stock Alerts (Inventory).
- **Column 2:** Outstanding Invoices (Accounts Receivable).
- **Column 3:** Liquidity Snapshot (Treasury).

---

## Component Requirements

To implement this layout effectively without bloating a single file, the following components must be created:
1. `DashboardSkeleton`: A complex skeleton mirroring the grid layout.
2. `MetricCard`: A reusable KPI component supporting sparklines and trend indicators.
3. `TrendChart`: A wrapper around Recharts that strictly utilizes dark-mode compliant CSS tokens.
4. `ActionList`: A reusable list component for both Pending Actions and Recent Activity.
5. `AlertWidget`: A specialized table/list hybrid for Low Stock and Outstanding Invoices.

---

## Migration Plan

1. **Phase 1: Component Extraction**
   - Extract the current Recharts implementations into isolated components (`RevenueChart.tsx`, `ExpenseChart.tsx`).
   - Refactor hardcoded hex colors to Tailwind/CSS variables (`stroke="hsl(var(--primary))"`).

2. **Phase 2: Layout Scaffolding**
   - Implement the new CSS Grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6`).
   - Inject the `DashboardSkeleton` for loading states.

3. **Phase 3: Data Integration**
   - Update `useDashboardQuery` to support the new `Pending Actions` mock data requirements.
   - Bind the extracted components to the data layer.

4. **Phase 4: Polish**
   - Verify empty states, dark mode contrast, and mobile responsiveness.

---

## Risk Assessment

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Recharts Dark Mode Failure** | Medium | Using CSS variables inside SVG props in Recharts can be finicky. We must test explicitly by forcing dark mode and ensuring variables resolve correctly. |
| **Grid Overflow** | High | Deeply nested charts inside CSS Grid can cause horizontal scrolling if `min-w-0` is not applied properly to wrappers. |
| **Data Mismatch** | Low | The backend hook `useDashboardQuery` might not immediately supply "Pending Actions". We will mock this array if necessary to ensure UI completion. |
