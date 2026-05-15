# Reports Redesign Proposal

## Goals
1. Standardize the `ReportsView` onto the established ERP layout patterns utilizing `DataTable` and `MetricCard`.
2. Drastically improve report discoverability by migrating from hardcoded cards to a searchable catalog.
3. Provide immediate data value through top-level KPIs.
4. Maintain 100% compatibility with the existing `useExport` logic.

---

## Layout Proposal: Reports Dashboard

### Top Row KPI Cards (`MetricCard`)
Instead of an empty page header, we will surface aggregate metrics so the user gains immediate value before even downloading a report:
- Revenue
- Expenses
- Profit
- Inventory Value
- Purchasing Spend

### Report Catalog (`DataTable`)
The hardcoded grid of cards will be replaced with a highly scalable `DataTable`. 

**Columns:**
- **Report Name** (e.g., "Sales Ledger", "Inventory Valuation")
- **Category** (e.g., "Financial", "Operations", "Tax")
- **Last Generated** (Timestamp)
- **Frequency** (e.g., "Monthly", "On-Demand")
- **Actions** (The `useExport` trigger button, housed safely inside the row)

---

## Filter Bar Integration

To manage the growing catalog of reports, we will implement the standard Shadcn filter toolbelt above the DataTable:
- **Search:** Instant text filtering against Report Name and Description.
- **Category Dropdown:** Isolate Financial vs Operational reports.
- **Date Range Dropdown:** (Reserved for future parameters passed to the export engine).
- **Owner Dropdown:** Filter by who created custom reports.

---

## Export Workflow Modernization

The existing `useExport` hook is robust. Rather than rendering the loading state (`Loader2`) inside a static card, we will map the `isRequesting` and `status` variables to a disabled/loading state on the row's Action button. Once `url` is populated, the button will transform into a "Download" state.

*(Note: We will not modify the backend export queuing, CSV generation, or PDF logic).*

---

## Implementation Plan

1. **Files to Modify:**
   - `features/reports/components/reports-view.tsx`
2. **Components to Remove:**
   - `ReportExportCard` (Logic will be absorbed into the DataTable `ColumnDef`).
3. **Data Requirements:**
   - We will need to construct a static array of `ReportDefinition` objects to feed the `DataTable` since the reports are currently hardcoded UI elements.
4. **Rollback Strategy:** Git revert `reports-view.tsx`. No backend or API changes are required.
