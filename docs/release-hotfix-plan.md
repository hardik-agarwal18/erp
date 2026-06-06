# Hotfix Implementation Plan

## Hotfix 1: Search Input Debouncing

**Objective:** Prevent micro-stutters and unnecessary recalculation of React `useMemo` hooks by delaying the client-side array `.filter()` execution until the user stops typing.

### Target Areas
- **Inventory:** `InventoryItemsListView`
- **Sales:** `InvoiceListView`, `SalesDashboardView`
- **Purchasing:** `PurchaseListView`
- **Accounting:** `TransactionListView`
- **Reports:** `ReportsView`

### Requirements
- Introduce a reusable `useDebounce<T>(value: T, delay: number)` hook within `@/hooks`.
- Update local `search` state instantly, but pass the *debounced* search value into the `useMemo` dependency array for data filtering.
- Preserve existing dropdown and filter mechanics.
- Do not alter React Query data fetching (as our filtering is primarily client-side).

### Estimate
- **Files Impacted:** ~6 List Views + 1 new Hook.
- **Risk Level:** **Low**. The change is strictly isolated to the dependency array of the existing `useMemo` block.
- **Testing Strategy:** Manually type rapidly in the global search bar on the heaviest view (Inventory). Ensure the UI does not stutter, and that the result set accurately reflects the final input string ~300ms after typing ceases.

---

## Hotfix 2: Native Select Dark Mode Compliance

**Objective:** Correct severe color contrast and readability issues where legacy `HTMLSelectElement` nodes are rendering black text on dark gray backgrounds during Dark Mode.

### Audit Targets
- Settings Pages (`SettingsOrganizationView`, `SettingsMembersView`)
- Organization Management forms.
- Any legacy creation modals not yet ported to Shadcn `<Select>`.

### Requirements
- Rather than refactoring the actual components to use Shadcn Selects (which risks breaking `react-hook-form` bindings right before launch), we will apply a targeted global CSS override.
- Ensure the override maps the native `<select>` background and text colors to the semantic CSS variables (`var(--background)` and `var(--foreground)`).
- Preserve native dropdown arrow icons via CSS appearance rules.

### Estimate
- **Files Impacted:** `app/globals.css` (or `index.css`).
- **Risk Level:** **Very Low**. It is a purely cosmetic CSS rule targeting standard elements.
- **Testing Strategy:** Toggle Dark Mode in the main application. Navigate to Settings -> Organization Profile. Expand a native dropdown and ensure the options list is legible against the dark background.
