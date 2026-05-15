# Performance Audit

## 1. Dashboard Render Performance
- **MetricCard:** Extremely lightweight. Relies on simple flexbox DOM nodes with zero heavy state. Render cost is negligible.
- **TrendChart:** Because charting libraries (like Recharts) manipulate SVG/Canvas heavily, rendering 2-4 TrendCharts concurrently blocks the main thread momentarily.
- **DashboardSkeleton:** Loading state is excellent. `DashboardSkeleton` prevents layout shift, dropping Cumulative Layout Shift (CLS) scores to near 0.

**Impact:** Low-Medium
**Opportunities:** Lazy load the `TrendChart` component dynamically so the `MetricCards` and `DataTables` paint immediately without waiting for charting bundles.

## 2. DataTable Performance
- **Memoization:** The migration to TanStack Table correctly wrapped all `columns` and `data` in `useMemo`. This prevents the entire table from rerendering when parent dashboard state (like filter changes) occurs.
- **Filtering:** Client-side filtering via `.filter()` arrays is highly performant for datasets under 2,000 rows. However, typing rapidly in the Search input causes consecutive rerenders.
- **Stale Closures:** React Query's `data` payload flows cleanly into the `DataTable` without stale closure issues.

**Impact:** Medium
**Opportunities:** Implement a debounce hook (e.g., `useDebounce`) on all `Search` inputs in the Filter Bar to prevent the `filteredOrders` or `filteredTransactions` useMemo from firing on every single keystroke.

## 3. Layout Architecture
- **Sidebar & Navbar:** The migration to CSS Grid (`grid-cols-[auto_minmax(0,1fr)]`) eliminated JavaScript-based resize event listeners. AppShell layout paints instantly.
- **State Management:** The Sidebar uses localized state for collapsing.
- **Rerender Boundaries:** Because routing happens within the main content grid pane, the Sidebar and Navbar do not rerender during module navigation.

**Impact:** Low
**Opportunities:** Ensure local storage interactions for Sidebar state do not trigger React hydration mismatches on first load.

## 4. Bundle Review
- **Duplication:** `lucide-react` is used universally, preventing multiple icon sets from bloating the bundle.
- **Charting Costs:** Recharts/SVG components are notoriously heavy.
- **Date Libraries:** Native `Intl.DateTimeFormat` and basic string manipulation is heavily favored over heavy libraries like `moment.js`.

**Impact:** Medium
**Opportunities:** Analyze bundle chunks and code-split the chart library explicitly.
