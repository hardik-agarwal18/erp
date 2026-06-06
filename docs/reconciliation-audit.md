# Bank Reconciliation Audit

## Current Architecture
The `BankReconciliationView` orchestrates a split layout (`xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]`) placing the historical reconciliation cycles on the left, and a `BankReconciliationForm` on the right for initializing new matching cycles.

## 1. Selection State & Matching Logic
- **Strengths:** By deferring the complex side-by-side transaction matching to a dedicated sub-view (or separate step post-initialization), the initial dashboard is kept relatively clean.
- **Weaknesses:** The current layout doesn't actually expose the matching logic; it merely shows the *summary* of the cycles (Statement vs Ledger vs Variance). The actual "Unmatched Items" are just a counter (`unmatchedCount`) without interactive drill-down capabilities directly from the table.

## 2. Data Flow
- **Strengths:** Powered cleanly by `useReconciliationsQuery` which aggregates the top-level variance.
- **Weaknesses:** The `BankReconciliationForm` requires manual entry of the "Ledger Balance" and "Statement Balance" instead of deriving them via the API based on the selected Bank Account and Statement Date.

## 3. UX Pain Points
- **Data Density:** The reconciliation cycle table uses the legacy HTML `<Table>` approach. There is no way to sort cycles by `Variance` or `Unmatched` counts, making it impossible to prioritize the worst-offending reconciliations.
- **Visual Feedback:** A variance of `0` looks identical to a variance of `$5,000`. There are no status badges, red text for severe variances, or success indicators for perfectly matched cycles.
- **Form Placement:** The static form on the right-side consumes ~35% of horizontal real-estate even when the user just wants to review historical cycles, squashing the table unnecessarily.
