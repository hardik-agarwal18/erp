# Accounting Module Audit

## 1. Accounting Dashboard (Transaction Dashboard)

### KPI Displays & Financial Summaries
**Strengths:**
- `TransactionSummary` calculates basic cash positions and general metrics properly based on the ledger queries.
**Weaknesses:**
- Heavily reliant on text-based summary blocks rather than `MetricCard` primitives, reducing scannability for finance officers.
- Trend analysis is completely absent. Cash flow trends and expense burn rates are not visualized.

### Ledger Readability
**Weaknesses:**
- Extremely dense tables utilizing raw HTML `<Table>` components that do not support dynamic column resizing, hiding, or client-side sorting.

## 2. Payments & Expenses
- Both modules use isolated, disparate layouts that don't match the Phase 4/5/6 patterns.
- **UX Gaps:** A user reviewing an invoice must pivot entirely away from the Sales context to hunt down payments in a disjointed table without any Quick Status filtering.

## 3. Bank Reconciliation
- **Strengths:** Functional workflow for matching internal ledger entries to external bank statements.
- **Weaknesses:** `bank-reconciliation-view` suffers from poor data density. Side-by-side transaction matching in the old UI requires excessive scrolling. Missing unified `AlertWidget` integration to proactively warn the user about unmatched anomalies.

## 4. Accessibility
- Relies heavily on native HTML `<select>` nodes which break dark mode expectations and have difficult focus trapping.
- Contrast issues in legacy transaction status badges (`transaction-status-badge`).
