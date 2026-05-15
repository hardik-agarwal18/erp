# AppShell Audit

## 1. Current AppShell
**Strengths:**
- Built with a clean, centered `max-w-[1440px]` wrapper that prevents the UI from looking disjointed on larger screens.
- Utilizes an elegant radial gradient background.
- Clean routing protection handling authenticated states and missing workspaces.

**Weaknesses:**
- The `max-w-[1440px]` constraint explicitly restricts the application from utilizing available screen real estate on larger monitors.
- The layout structure is deeply nested and highly rigid.

**ERP-Specific Pain Points:**
- Data-dense views (like the upcoming Inventory and Accounting tables) require maximum horizontal space. The current max-width wrapper forces columns to cramp, contradicting the purpose of an enterprise application.

**Opportunities:**
- Implement a fluid, full-width `100vw` container.
- Manage maximum widths at the page or component level, rather than globally in the AppShell wrapper, so that dense tables can expand infinitely while simple forms remain constrained.

---

## 2. Current Sidebar
**Strengths:**
- Supports both expanded (280px) and collapsed (88px) states natively.
- Clean visual hierarchy separating "Operations" from "Administration".
- Clean permission-based filtering (`canAccess`).

**Weaknesses:**
- The collapsed/expanded state is ephemeral (bound to `useState`), meaning it resets on full page reloads.
- Expandable accordions (e.g., Accounting, Inventory) also rely on local state and do not persist user preferences.
- Lacks quick-access paradigms.

**ERP-Specific Pain Points:**
- ERP power users typically spend 90% of their time in 2-3 specific sub-modules (e.g., an accountant exclusively using Invoices and Transactions). Forcing them to navigate the full hierarchy repeatedly is highly inefficient.

**Opportunities:**
- Introduce a "Favorites" or "Pinned" section at the top of the sidebar.
- Introduce a "Recent Pages" section dynamically tracked via local storage.
- Persist the collapsed/expanded state to local storage.

---

## 3. Current Navbar (TopNavbar)
**Strengths:**
- Feature-rich: integrates Workspace Switcher, Global Search, Breadcrumbs, Command Palette trigger, Notifications, and Profile menu.

**Weaknesses:**
- The layout is vertically stacked (`space-y-3` inside the left column). The top row holds the Switcher/Search, and the bottom row holds Breadcrumbs. This consumes excessive vertical pixels.

**ERP-Specific Pain Points:**
- Vertical real estate is the most valuable asset in table-heavy applications. Pushing the core content down to accommodate a multi-row header reduces the number of visible rows in data grids.

**Opportunities:**
- Consolidate the Navbar into a single 56px or 64px horizontal strip.
- Shift the breadcrumbs into the primary row or integrate them seamlessly into the Page Header.

---

## 4. Current Layout Hierarchy
**Strengths:**
- Clear structural separation: AppShell -> Sidebar -> Navbar -> Content.

**Weaknesses:**
- The DOM is deeply nested with multiple flex wrappers, potentially overcomplicating responsive adjustments.

**ERP-Specific Pain Points:**
- Sticky headers on DataTables might conflict with the `overflow` behaviors defined in the deep flex hierarchy.

**Opportunities:**
- Adopt standard CSS Grid for the root layout to allow the Sidebar and Content area to exist as direct siblings, vastly simplifying sticky behaviors and scrolling boundaries.

---

## 5. Current Content Width Strategy
**Strengths:**
- Safe defaults. A max-width of 1440px ensures typography never becomes illegibly wide.

**Weaknesses:**
- Ignores the nature of the data being displayed.

**ERP-Specific Pain Points:**
- Tables with 12+ columns (like Ledgers or Purchase Orders) will horizontally scroll even on a 4K monitor because the AppShell enforces a 1440px cap.

**Opportunities:**
- Switch to a full-bleed strategy (`w-full flex-1`). Add a `max-w-5xl` class explicitly inside simple form pages (like Settings), but allow `DataTable` pages to span 100%.

---

## 6. Current Navigation UX
**Strengths:**
- Fast, client-side routing via Next.js `<Link>`.
- Command Palette integration provides rapid jump-to functionality.

**Weaknesses:**
- No visual indication of loading states *between* fast transitions (only during initial fetch).
- Search bar is a generic placeholder and does not visibly integrate with the Command Palette.

**ERP-Specific Pain Points:**
- Discoverability is low. If a user doesn't know where "Stock Adjustments" lives, they must click through the accordions.

**Opportunities:**
- Unify the Search Bar and the Command Palette so clicking "Search" directly opens the global rapid-navigation palette.
