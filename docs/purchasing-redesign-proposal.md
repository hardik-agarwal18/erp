# Purchasing Redesign Proposal

## Goals
1. Standardize Purchasing onto the new Phase 4/5 design system.
2. Maximize reuse of `MetricCard`, `DataTable`, `ActionList`, `AlertWidget`, and `TrendChart`.
3. Increase procurement data density and surface approval bottlenecks instantly.

---

## Layout Proposal: Purchasing Dashboard

### Top Row KPI Cards (`MetricCard`)
- Open Purchase Orders
- Pending Approvals
- Goods Received Today
- Outstanding Payables
- Vendor Spend (MTD)

### Middle Row
- **Left (`TrendChart`):** Monthly Spend vs Budget (Visualizing liability over time).
- **Right (`AlertWidget`):** Highlighting Vendor Delivery Issues, Delayed POs, and Overdue Receipts.

### Bottom Row
- **Action Lists (`ActionList`):**
  - Purchase Orders Awaiting Approval
  - Pending Goods Receipts
  - Vendor Escalations

---

## Standardized Ledgers

We will upgrade the following legacy implementations to the highly interactive `DataTable` primitive:
- Purchase Orders (`PurchaseTable`)
- Vendor Purchase Orders
- Goods Received Notes

**Features Gained:**
- Automatic client-side column sorting.
- Density toggles (Comfortable vs Compact).
- Clean, dark-mode native empty states.

*Note: Backend data structures remain completely untouched.*

---

## Filter & Status Modernization

### Filter Bar
Standardize the toolbar above the `DataTable` utilizing Shadcn components and Lucide icons:
- Search Input
- Vendor Filter (Dropdown)
- Date Range Filter
- Status Filter

### Quick Status Tabs
Implement lightweight client-side tab triggers mimicking the Phase 6 Sales design:
- All | Draft | Pending Approval | Approved | Received | Closed

---

## Risk Assessment

| Risk Level | Component | Concern & Mitigation |
| :--- | :--- | :--- |
| **High** | DataTable Migrations | Breaking existing detailed cell renderers (e.g., statuses/currencies). Mitigation: Carefully map TanStack `accessorFn` to existing formatters. |
| **Medium** | Goods Received Integration | Linking GRN data into Dashboard widgets without backend changes. Mitigation: Derive alerts purely from existing client-side arrays. |
| **Low** | Quick Status Tabs | State collision with native filters. Mitigation: Ensure tab clicks simply update the single `filters.status` object. |

---

## Implementation Plan

1. **Files to Modify:**
   - `features/purchases/components/purchase-list-view.tsx`
   - `features/purchases/components/purchase-table.tsx`
2. **Components to Replace:**
   - `PurchaseSummary` -> `MetricCard`
   - Native `<select>` -> Custom Filter Bar & Quick Status Tabs
3. **Components to Reuse:**
   - `DataTable`, `MetricCard`, `TrendChart`, `AlertWidget`, `ActionList`
4. **Estimated LOC Reduction:** ~100-150 lines by leveraging unified Phase 4 primitives instead of custom mapped HTML blocks.
5. **Rollback Strategy:** All changes are isolated to the presentation layer. Reverting `purchase-list-view.tsx` and `purchase-table.tsx` via Git restores the exact legacy state.
