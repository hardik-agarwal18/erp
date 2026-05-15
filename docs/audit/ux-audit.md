# UX Audit

## Navigation
- **Issue**: Deeply nested sidebar items require multiple clicks to discover.
- **Opportunity**: Implement the `Cmd/K` command palette more prominently and ensure it acts as the primary power-user navigation tool.

## Visual Hierarchy
- **Issue**: The current layout uses a boxed `max-w-[1440px]` design with a gray background outside the box. This reduces screen real estate for wide tables.
- **Opportunity**: Move to a fluid layout. Use cards strictly for grouping, not as full-page wrappers.

## States (Loading, Error, Empty)
- **Loading**: The app relies heavily on `PageLoader` and `ModuleLoading` (spinners). Skeleton loaders are missing in most feature modules.
- **Error**: `ModuleError` exists, but inline form validation errors need strict consistency.
- **Empty**: `EmptyState` component exists but is underutilized in deeply nested tables (e.g., line items).

## Data Density
- **Issue**: Standard Tailwind padding (`p-4`, `p-6`) makes tables too tall, pushing data below the fold on standard laptop screens.
- **Opportunity**: Introduce a 'Dense' table variant utilizing 32px row heights and 8px cell padding.

## Accessibility
- Focus rings are currently bound to the default `--ring` color. Needs explicit contrast checking against the new palette.
