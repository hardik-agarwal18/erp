# Post-Launch Roadmap (v2.x)

With the core ERP Redesign Initiative complete, all subsequent frontend feature enhancements and major structural refactors are deferred to future releases.

## Version 2.1 Candidates

### Critical
- **Bank Reconciliation Modernization:** Break down the complex side-by-side legacy `<Table>` view into a modern, accessible interface that aligns with the rest of the application without losing efficiency.
- **Global Search:** Implement a command palette (`CMD+K`) allowing users to jump instantly to specific invoices, customers, or reports without using the sidebar.

### High Priority
- **Saved Views:** Allow users to save their specific `DataTable` filter states and column visibilities for rapid access.
- **Advanced Form Standardization:** Rework all remaining legacy pages (specifically Org Settings and Permissions workflows) strictly into `react-hook-form` + Shadcn/Zod pipelines, completely eliminating native HTML `<select>` tags.

### Nice to Have
- **Custom Dashboards:** Provide user-level permissions to drag, drop, and configure which `MetricCards` and `TrendCharts` render on their personal `DashboardView`.
- **Advanced Reporting:** Transition the Reports module from purely "Request CSV Export" to rendering the report data directly on-screen inside expanded DataTables.
- **Column Preferences:** Provide a UI popover for `DataTable` allowing users to toggle column visibility dynamically.
