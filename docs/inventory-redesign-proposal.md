# Inventory Redesign Proposal

## Goals
1. Maximize `DataTable` usage across all inventory lists.
2. Improve warehouse workflows by surfacing interactive queues.
3. Eliminate hardcoded legacy UI patterns in favor of Phase 4 modular components.
4. Improve low-stock awareness.

## 1. Layout Proposal
**Top Row:**
- Utilize the `MetricCard` grid for inventory valuation, total items, and critical alerts.

**Middle Row (Main Viewport):**
- A full-width, edge-to-edge `DataTable` implementation of the Inventory Items ledger.
- This will completely remove the right-hand split, granting 100% width to the dense 10-column table.

**Bottom Row:**
- 3-Column Grid utilizing `AlertWidget` and `ActionList`.
- **Column 1:** Low Stock Alerts (`AlertWidget`).
- **Column 2:** Transfer Queue (`ActionList`).
- **Column 3:** Audit Plans (`ActionList`).

## 2. Component Reuse Strategy
- **`MetricCard`**: Replace `InventoryKpiGrid`.
- **`DataTable`**: Replace `InventoryItemsTable`.
- **`AlertWidget` / `ActionList`**: Replace the raw mapped `<div>` lists for Alerts, Transfers, and Audits.
- **Forms**: The embedded `InventoryFormPanel` will be stripped from the grid and relocated to a global Slide-over/Drawer, triggered via the PageHeader "Add Item" button.

## 3. Migration Plan
1. **Wave 3 Table Execution:** Migrate `inventory-items-table.tsx` to `DataTable` (Phase 2C.3).
2. **Component Swaps:** Refactor `inventory-dashboard-view.tsx` to consume the Phase 4 dashboard primitives.
3. **Form Extraction:** Move `InventoryFormPanel` into a Dialog/Sheet to reclaim horizontal layout space.
4. **Dark Mode Audit:** Ensure all legacy `text-slate-950` references are converted to `text-foreground`.

## 4. Risk Assessment

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Data Structure Mismatch** | Medium | The `DataTable` requires strict column definitions. We must ensure `InventoryItem` type aligns perfectly with the TanStack accessor keys. |
| **Form State Loss** | High | Extracting the `InventoryFormPanel` into a Drawer may reset local state. We must bind it to the global layout correctly or handle form persistence. |
| **Pagination Handling** | Low | The current array is likely un-paginated. The `DataTable` will introduce client-side pagination natively, instantly improving render performance. |
