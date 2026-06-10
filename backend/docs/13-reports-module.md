# Reports Module

**Location:** `src/modules/reports/`

Generates real-time financial and operational metrics, serving data for dashboards and deep-dive reports. Includes asynchronous export functionality.

---

## Files

| File | Purpose |
|---|---|
| `report.service.ts` | Complex aggregations, data grouping, and metric computation |
| `report.controller.ts` | HTTP request/response handling (including BullMQ job dispatch) |
| `report.routes.ts` | Express route definitions with permission guards |
| `report.repository.ts` | Prisma-based analytic queries, grouping, and sums |
| `report.types.ts` | TypeScript interfaces for report structures |
| `report.validators.ts` | Zod request schemas |

---

## Routes

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/reports/dashboard` | ✅ | `reports.view` | Get all high-level metrics for the dashboard |
| `GET` | `/reports/sales` | ✅ | `reports.view` | Detailed sales report over a date range |
| `GET` | `/reports/expense` | ✅ | `reports.view` | Detailed expense report |
| `GET` | `/reports/inventory` | ✅ | `reports.view` | Stock value, low-stock items, recent movements |
| `GET` | `/reports/tax` | ✅ | `reports.view` | Tax liabilities and collections |
| `POST` | `/reports/export` | ✅ | `reports.export` | Dispatch an async report export job |
| `GET` | `/reports/export/:jobId` | ✅ | `reports.view` | Check export job status |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Validators (`report.validators.ts`)

| Schema | Validates |
|---|---|
| `reportRangeSchema` | `query: { startDate?, endDate? }` (Must be valid ISO datetime if provided) |
| `exportReportSchema` | `body: { reportType: Enum(SALES, FINANCIAL, INVENTORY), startDate, endDate, frequency? }` |
| `exportStatusSchema` | `params: { jobId: string }` |

---

## Service Functions (`report.service.ts`)

### `reportService.dashboardMetrics(organizationId)`
Generates comprehensive data for the main dashboard.
1. Computes `start` and `end` bounds for: Current Month, Previous Month, and Last 6 Months.
2. In parallel (`Promise.all`), fetches:
   - Current month sales and expenses.
   - Previous month sales and expenses (for trend calculations).
   - Last 6 months sales and expenses (for historical charts).
   - Current month inventory valuation.
   - Current month tax report.
3. Computes trends comparing current vs previous month (e.g., `+12%`).
4. Extracts `unpaidInvoices` count, `profitEstimate` (Sales - Expenses), and `topCustomers`.
5. Fills in missing months with zero-values for reliable charting over the exact 6-month array.

### `reportService.salesReport(organizationId, range)`
Aggregates sales performance for a specific date range.
- Groups invoices by customer to identify top buyers.
- Formats `monthlySales` by extracting month keys (`YYYY-MM`).
- Returns `totalSales`, `invoiceCount`, `averageInvoiceValue`, `topCustomers`, and `monthlySales`.

### `reportService.expenseReport(organizationId, range)`
Aggregates outgoing costs.
- Groups expenses by category.
- Formats `monthlyExpenses` by month keys (`YYYY-MM`).
- Returns `totalExpenses`, `expensesByCategory`, and `monthlyExpenses`.

### `reportService.inventoryReport(organizationId)`
Analyzes current stock standing.
- Calculates `stockValue` (Stock Quantity * Purchase Price).
- Identifies `lowStockItems` (Quantity <= Reorder Level).
- Returns `stockValue`, `lowStockItems`, and a list of recent `movements`.

### `reportService.taxReport(organizationId, range)`
Aggregates tax information.
- Sums `taxAmount` across all invoices in the given range.
- Returns `taxCollected` and `taxLiability`.

---

## Repository Functions (`report.repository.ts`)
Uses Prisma's `aggregate`, `groupBy`, and `count` functions heavily to push calculation down to the database layer (e.g. `_sum`, `_count`). Avoids loading entire raw lists into Node memory whenever possible.

---

## Controller Functions (`report.controller.ts`)

| Function | Key Behavior |
|---|---|
| `salesReport`, `expenseReport`, `inventoryReport`, `taxReport`, `dashboard` | Returns 200 OK with aggregated JSON payload. |
| `exportReport` | Dispatches job via `reportsQueue.add("export-report")`. Returns 202 Accepted with `{ jobId }`. |
| `getExportStatus` | Checks BullMQ via `reportsQueue.getJob(jobId)`. Returns job state and URL if completed. |
