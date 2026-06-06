# Table System Audit & Redesign Proposal (Phase 2C)

## 1. Current State
We have successfully identified 20 discrete table implementations across the application. 

A review of `transaction-table.tsx`, `inventory-items-table.tsx`, and `invoice-table.tsx` reveals a highly consistent, but severely limited, foundational pattern.

| Feature | Current Support Level | Notes |
| :--- | :--- | :--- |
| **Row Height** | ~48px (Fixed) | Hardcoded via `py-3` padding in `TableCell`. |
| **Pagination** | ❌ None | Handled entirely by parent views, if at all. No table primitive support. |
| **Sorting** | ❌ None | Tables render static `.map()` lists. No column header interactivity. |
| **Filtering** | ❌ None | No native filtering. |
| **Search** | ❌ None | Handled via external inputs. |
| **Bulk Actions** | ❌ None | No `<Checkbox>` selection column exists. |
| **Export** | ❌ None | |
| **Sticky Headers**| ❌ None | `thead` scrolls out of view on long lists. |
| **Sticky Columns**| ❌ None | |

---

## 2. ERP Workflow Analysis
Tables are the backbone of this application. Here is the distribution and priority ranking based on business impact:

1. **Accounting / Finance (Critical)**
   - *Tables*: `transaction-table.tsx`, `invoice-table.tsx`, `payment-table.tsx`, `expense-table.tsx`, `bank-reconciliation-view.tsx`.
   - *Requirements*: Extreme data density, sorting by amount/date, sticky headers for long ledgers.
2. **Inventory (Critical)**
   - *Tables*: `inventory-items-table.tsx`, `stock-transfers-view.tsx`, `stock-adjustments-view.tsx`.
   - *Requirements*: Bulk actions (e.g., mass stock adjustments), dense rows (32px), export to CSV.
3. **Purchases & Sales (High)**
   - *Tables*: `purchase-table.tsx`, `vendor-purchase-orders.tsx`, `goods-received-notes-view.tsx`.
   - *Requirements*: Status filtering, pagination.
4. **CRM / Vendors (Medium)**
   - *Tables*: `customer-table.tsx`, `vendor-table.tsx`, `settings-members-view.tsx`.
   - *Requirements*: Standard comfortable viewing, simple search.

---

## 3. Current Pain Points
- **Data Density**: A strict 48px row height forces excessive scrolling for accountants trying to reconcile 100+ transactions.
- **Scanability**: The lack of sticky headers means users lose column context (e.g., "Is this column Credit or Debit?") after scrolling down.
- **Interactivity**: Users cannot click column headers to sort by Amount or Date, a fundamental requirement for financial software.
- **Redundancy**: The lack of a unified `<DataTable>` component means every feature module manually reconstructs `thead`, `tbody`, and `tr` maps.

---

## 4. Proposed Enterprise Table Standard

We propose building a highly capable, unified `<DataTable>` component.

### Density Modes
- **Compact Mode**: 32px row height (`py-1.5 px-3`). Default for Inventory and Ledgers.
- **Comfortable Mode**: 48px row height (`py-3 px-4`). Default for Customers and Settings.

### Core Features to Implement
- **Table Engine**: Standardize on `@tanstack/react-table` as the headless UI foundation. We will build a thin enterprise wrapper (`DataTable`) to avoid writing custom logic for sorting, filtering, and selection.
- **Sticky Headers**: Wrap the table in a `<div className="relative overflow-auto">` with `sticky top-0 bg-background z-10` applied to headers.
- **Sorting & Pagination**: Managed natively through TanStack Table state.
- **Column Visibility**: Allow users to dynamically toggle columns on and off.
- **Saved Column Preferences**: Automatically persist column visibility preferences to `localStorage` (or the backend) to enhance the user experience across sessions.
- **Row Selection & Bulk Actions**: Inject a generic checkbox column tied to TanStack's row selection state.
- **Empty & Loading States**: Standardized visual states for `data.length === 0` or `isLoading`.
- **Future Architecture (Saved Views)**: The wrapper's state management must be architected to accept external, serializable state objects. While deferred for now, this ensures future support for "Saved Views" (e.g., loading a pre-configured set of filters, sorting, and column visibility).

---

## 5. Migration Risk Assessment

### High-Risk Tables
`invoice-table.tsx` and `transaction-table.tsx`. These drive the core revenue and reconciliation flows. Breaking the data mapping here breaks the application.

### Safe Migration Strategy
1. **Do not modify existing tables immediately.**
2. Refactor the underlying UI primitives (`src/components/ui/table.tsx`) to support semantic tokens (`bg-muted`, `border-border`, etc.) without breaking their simple HTML-wrapper nature.
3. Introduce a net-new **`src/components/ui/data-table.tsx`** component that accepts a `columns` and `data` prop.
4. Iteratively migrate feature tables (e.g., starting with `settings-members-view.tsx` as a low-risk test) to the new `DataTable` component.
