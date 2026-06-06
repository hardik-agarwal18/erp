# Accessibility Audit

## 1. Navigation
**AppShell, Sidebar, Navbar, & Breadcrumbs**
- **Keyboard Navigation & Tab Order:** Tab sequence naturally flows from the Sidebar into the Top Navbar and down into the main content. The newly implemented single-row 56px Navbar preserves sequential focus without skipping.
- **Focus Visibility:** Standard Shadcn focus rings (`ring-2 ring-ring ring-offset-2`) are correctly applied to most interactive elements, though custom utility buttons in some views require explicit focus-visible states.
- **Screen Reader Compatibility:** The Sidebar correctly leverages `<nav>` and `<ul>` semantics. However, `aria-current="page"` is consistently applied ensuring screen readers announce the active route.

**Severity:** Low
**Fixes:** Ensure custom filter bar buttons possess `aria-label` or SR-only text, especially those using icon-only configurations.

## 2. DataTables
**All Migrated Ledgers (Settings, Customers, Vendors, Inventory, Invoices, Purchasing, Accounting, Reports)**
- **aria-sort:** Native to TanStack Table, but requires the explicit rendering of sorting indicators in the column headers to be announced correctly.
- **Keyboard Sorting:** Headers must be focusable. Currently, column headers are mostly standard `<th>` tags without `<button>` wrappers for sorting.
- **Row Focus States:** Row selection and focus states are visible, but `aria-selected` needs verification on custom row interactions.
- **Empty States:** The `EmptyState` component correctly utilizes semantic heading tags (`<h3>`) and high-contrast text, making it highly accessible.

**Severity:** Medium
**Fixes:** Wrap sortable `DataTable` headers in a focusable `<button>` with `aria-sort` attributes. Add `aria-label` to row action dropdowns.

## 3. Forms
**Inputs, Selects, Textareas, Buttons**
- **Labels & Descriptions:** Most forms in the ERP use Shadcn's `<Form>` primitive which handles `aria-describedby` automatically, linking inputs to validation messages.
- **Native Selects:** A few legacy views (e.g., standard forms) still use native `<select>` tags which break styling consistency but inherently maintain high accessibility.
- **Focus Rings:** `focus-visible` is successfully applied across all inputs.

**Severity:** Low
**Fixes:** Ensure `aria-invalid="true"` is strictly passed to inputs that trigger Zod validation errors.

## 4. Color Contrast
**Light & Dark Mode (WCAG Compliance)**
- **Text & Badges:** Our semantic token migration (`bg-card`, `text-card-foreground`) guarantees high contrast across themes. `Badge` variants (success, danger, warning) pass WCAG AA requirements in both modes.
- **Alerts & KPI Cards:** `AlertWidget` relies on semantic border colors rather than low-contrast backgrounds, improving readability.
- **Charts:** `TrendChart` relies on `hsl(var(--primary))` and `hsl(var(--muted-foreground))`. The muted foreground on dark mode can sometimes fall below the 4.5:1 ratio depending on screen glare.

**Severity:** Low
**Fixes:** Bump `muted-foreground` contrast slightly in the dark mode CSS variable root.
