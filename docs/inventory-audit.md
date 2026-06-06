# Inventory Module Audit

## 1. Inventory Dashboard
**Strengths:**
- Centralized view for operational health.
- Clear separation between Items, Transfers, and Audits.
**Weaknesses:**
- Grid layout uses outdated `minmax` strategies that don't stretch fluidly in the new AppShell.
- Hardcoded list mappings for Alerts, Transfers, and Audits, duplicating list component logic instead of using reusable widgets.
**UX Opportunities:**
- Replace custom lists with the new Phase 4 `AlertWidget` and `ActionList` components.
- Move the search bar out of the table card and into the global module header or table toolbar.

## 2. Inventory Tables
**Strengths:**
- High data density (Item, SKU, Warehouse, On Hand, Reserved, Available, Valuation).
**Weaknesses:**
- Still relies on the legacy raw `Table` component.
- Zero interactivity: No sorting, no filtering, no column visibility, and no pagination.
- Hardcoded slate text colors (`text-slate-950`) breaking dark mode.
**UX Opportunities:**
- Immediate candidate for Phase 2C.3 (Wave 3) `DataTable` migration.
- Add dynamic "Available" calculation sorting.

## 3. Stock Transfers
**Strengths:**
- Tracks `fromWarehouse` to `toWarehouse` with ETAs.
**Weaknesses:**
- Rendered passively as a generic card list.
- Missing quick-actions (e.g., "Mark Received", "Cancel").
**UX Opportunities:**
- Convert the Transfer Queue into an interactive `ActionList`.

## 4. Stock Adjustments
**Strengths:**
- Exists as a dedicated sub-view.
**Weaknesses:**
- Disconnected from the main dashboard flow; forces users to navigate away entirely to post a simple variance.
**UX Opportunities:**
- Expose "Quick Adjustment" via a Command Palette or Slide-out Drawer directly from the dashboard.

## 5. Inventory Forms
**Strengths:**
- Co-located in the dashboard (`InventoryFormPanel`).
**Weaknesses:**
- Permanently embedded in the right-hand column, consuming precious horizontal real estate even when not in use.
**UX Opportunities:**
- Move form creation into a floating Sheet/Drawer to free up the grid for maximum table width.

## 6. Inventory Detail Views
**Strengths:**
- Unknown / minimal footprint.
**Weaknesses:**
- The current items table rows are entirely static. There is no `onClick` to dive into SKU history.
**UX Opportunities:**
- Add row-click navigation in the `DataTable` implementation to view SKU-level ledgers.

---

### Global Data Density & Accessibility Issues
- **Density:** The embedded legacy table is squeezed next to a form panel, severely restricting column space and forcing text truncation.
- **Accessibility:** Badges use hardcoded hexes or un-audited contrast ratios. The table lacks ARIA labels for sorting/filtering because those features don't exist.
