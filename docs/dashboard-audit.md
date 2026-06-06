# Dashboard Audit

## 1. Current Layout
**Strengths:**
- Structured effectively using CSS Grid.
- Employs split-pane track sizing (e.g., `xl:grid-cols-[minmax(0,1.55fr)_minmax...]`) for varied component emphasis.
**Weaknesses:**
- Grid sizing relies heavily on `xl:` breakpoints and hardcoded `minmax` tracks. It lacks intermediary breakpoints (`md:`, `lg:`), which forces the layout into a single column on 1024px tablet/laptop screens.
- Highly coupled to the exact shape of the mock `data` object.
**UX Opportunities:**
- Implement a fluid 12-column grid system that scales smoothly from `md` through `2xl` to leverage the new full-width AppShell.

## 2. KPI Cards
**Strengths:**
- Minimalist design.
- Excellent use of semantic Badges (`success`, `danger`) with directional arrows.
**Weaknesses:**
- Static and non-interactive. They provide no ability to click through or drill down into the underlying reports.
- Hardcoded assumption that `formatCompactCurrency` applies to all KPIs (problematic if a KPI is "Total Users" or "Active Warehouses").
**UX Opportunities:**
- Introduce micro-interactions (hover states, drill-down links).
- Add 7-day sparklines directly into the KPI card background for immediate contextual trending.

## 3. Charts
**Strengths:**
- Built robustly with Recharts (`ResponsiveContainer`, `LineChart`, `BarChart`).
- Visually clear legends and tooltips.
**Weaknesses:**
- Stroke and fill colors are hardcoded hex values (e.g., `#2563eb`, `#14b8a6`). These will completely fail to invert or adapt correctly in Dark Mode.
- Grid lines (`#e2e8f0`) are hardcoded, causing harsh contrast issues in dark themes.
**UX Opportunities:**
- Refactor all Recharts implementations to consume CSS variables (`hsl(var(--primary))`, `hsl(var(--muted))`) to ensure flawless dark mode support.

## 4. Recent Activity
**Strengths:**
- Dedicated component block with clear typography and timestamps.
**Weaknesses:**
- Relegated to the third row, embedded next to operational charts. It competes for horizontal real estate.
- Unactionable (no links to the actual activity source).
**UX Opportunities:**
- Upgrade list items to clickable `<Link>` rows.
- Move it to a dedicated "Operations" row or right-rail.

## 5. Quick Actions
**Strengths:**
- Located prominently in the `PageHeader` ("Export Pack", "Close Month").
**Weaknesses:**
- Too generic. There are no contextual actions for immediate operational needs (e.g., "Create Invoice", "Receive Stock").
**UX Opportunities:**
- Introduce a dedicated "Pending Actions" widget that surfaces high-priority workflows (e.g., 3 Invoices require approval).

## 6. Empty States
**Strengths:**
- Utilizes the `EmptyState` primitive component.
**Weaknesses:**
- Passive tone. If the dashboard is empty, the user is stranded without a call-to-action.
**UX Opportunities:**
- Provide actionable Next Steps directly within the empty state (e.g., "Connect your bank account" or "Create your first invoice").

## 7. Loading States
**Strengths:**
- `isError` is handled gracefully via `ModuleError`.
**Weaknesses:**
- There is no explicit loading skeleton. If `query.data` is undefined, it instantly falls back to the `EmptyState`, creating a jarring UI flash.
**UX Opportunities:**
- Implement a comprehensive `DashboardSkeleton` using `Skeleton` primitives to maintain layout stability during network requests.

## 8. Mobile Behavior
**Strengths:**
- Grid falls back to a 1-column stack naturally.
**Weaknesses:**
- Recharts `ResponsiveContainer` requires explicit heights. On mobile, 260px or 290px fixed heights can consume too much vertical space.
**UX Opportunities:**
- Utilize `aspect-ratio` configurations or responsive height overrides (`h-[200px] md:h-[260px]`) for charts.

## 9. Desktop Behavior
**Strengths:**
- Executive-level data density on large monitors.
**Weaknesses:**
- Lacks modularity. A user cannot rearrange or hide widgets they don't care about.
**UX Opportunities:**
- Build the foundation for future widget reordering by isolating each card into its own discrete component rather than mapping over them in one massive file.
