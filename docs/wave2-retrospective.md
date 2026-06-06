# Wave 2 Migration Retrospective

## Overview
Wave 2 focused on migrating Medium Risk list views inside the Customer and Vendor modules to the new headless `<DataTable>` architecture. 

## 1. Problems Encountered
- **Verbose Definitions**: Extracting nested JSX from a standard `TableBody` `.map()` loop into a `useMemo` column array slightly increased visual boilerplate at the top of the file.
- **Card Nesting**: The default `DataTable` ships with a rounded border and shadow. When placing a `DataTable` inside an existing `<CardContent>` container (as seen in `customer-transactions.tsx`), it creates a double-border effect. We had to manually pass `className="shadow-none border-muted"` to suppress this.

## 2. DataTable Limitations Discovered
- **Column Alignment**: The current TanStack Table implementation lacks an abstraction for text alignment. To right-align numeric amounts, we had to manually inject `<div className="text-right">` inside both the `header` and `cell` components for every single currency column.

## 3. Repeated Migration Patterns
- **Status Badges**: Every table mapped a string literal `status` to a colored `<Badge>`.
- **Currency Mapping**: Repeatedly injecting `formatCurrency(row.getValue("property"))` into custom `cell` renderers.
- **Action Menus**: Repeatedly building a flex container with `<Link>` components to "View" and "Edit" records.

## 4. Recommended DataTable Improvements
Before we hit the extremely dense ledgers in Waves 4 and 5, we should implement the following enhancements to the `DataTable` engine:
1. **Meta Alignment Prop**: Update `data-table.tsx` to read `header.column.columnDef.meta?.align`. If `"right"`, automatically apply `text-right` to the `TableCell`. This eliminates the need for manual `div` injection in consumers.
2. **Global Column Factories**: Create a utility file (e.g., `table-utils.tsx`) that exports `createCurrencyColumn`, `createBadgeColumn`, and `createActionColumn` to drastically reduce LOC in consumer files.

## 5. Readiness Assessment for Wave 3
Wave 3 targets the **Inventory System** (High Value).
These tables demand high data density and robust sorting. The `<DataTable>` currently supports a fully verified `density="compact"` mode and native sorting state.

**Verdict: READY**. The architecture is stable, type-safe, and visually polished. However, we should evaluate implementing the "Meta Alignment Prop" (mentioned above) before executing Wave 3 to save time.
