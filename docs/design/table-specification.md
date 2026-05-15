# Table System Specification (Phase 2C Redesign Proposal)

## 1. Analysis of Current Implementation
The current `Table` component (`src/components/ui/table.tsx`) is a thin wrapper over standard HTML table elements.
- **Visuals**: Uses hardcoded slate colors (`border-slate-100`, `bg-slate-50`, `text-slate-500`).
- **Density**: Header padding is `py-2`, Cell padding is `py-3`. This limits row density.
- **Functionality**: No built-in sorting, filtering, pagination, sticky headers, or bulk actions. These are likely handled ad-hoc in feature components.

## 2. Redesign Proposal

### Row Density
We need multiple density modes to support different ERP use cases:
- **Default**: 48px row height (`py-3 px-4`). Good for primary dashboards.
- **Dense**: 32px row height (`py-1.5 px-3`). Crucial for inventory management and journal entries where users need to see 30+ rows per screen.

### Sorting
- Implement sortable headers.
- Visual indicator: A small `lucide-react` Chevron icon (Up/Down) appears on hover or when active.
- Keyboard accessible via Space/Enter on `TableHead`.

### Filtering
- **Global Search**: Command palette style search above the table.
- **Column Filters**: Filter popovers attached to specific headers (e.g., "Status: Paid").

### Pagination
- A standardized `TablePagination` component docked at the bottom of the table wrapper.
- Includes "Rows per page" selector and Previous/Next buttons.

### Sticky Headers
- Wrap the table in a `<div className="relative w-full overflow-auto max-h-[800px]">`.
- Apply `sticky top-0 bg-background z-10` to the `TableHeader` row to ensure context is never lost when scrolling through 100+ rows.

### Bulk Actions
- Add an integrated `<Checkbox>` as the first column for selectable tables.
- A floating "Bulk Action Bar" appears when `selectedRows.length > 0`, offering actions like "Delete", "Export", or "Mark as Paid".

### Export Functionality
- Standardized "Export CSV" and "Export PDF" dropdown menu placed in the top right of the table's toolbar container.

## 3. Implementation Strategy (Phase 2C)
When Phase 2C begins, we will refactor `table.tsx` to use semantic CSS variables (`bg-muted`, `border-border`, `text-muted-foreground`), add sticky positioning, and create a robust `DataTable` composition component using `@tanstack/react-table` (if available, or pure React state) to handle advanced functionality without breaking simple use cases.
