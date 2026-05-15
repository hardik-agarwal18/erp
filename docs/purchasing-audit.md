# Purchasing Module Audit

## 1. Purchasing Dashboard

### KPI Displays & Summary Widgets
**Strengths:**
- Basic aggregates are already present via `PurchaseSummary`.
**Weaknesses:**
- The summary components are custom mapped HTML blocks lacking visual punch, density, or trend analysis.
- Important metrics like "Pending Approvals" or "Goods Received Today" are not prioritized in a dashboard-level view.

### Spend Tracking
**Weaknesses:**
- Zero visual tracking. The dashboard relies entirely on the raw ledger to convey open liabilities.

### UX & Accessibility
- **UX Gaps:** "Receiving Focus" is hidden at the bottom of the page in a static card. Users must hunt through status filters to find actionable items.
- **Accessibility:** Filters rely on legacy `<select>` dropdowns and hardcoded `slate` colors (`text-slate-950`) which fail dark mode contrast requirements.

---

## 2. Purchasing Tables

### Current Implementation
- **Purchase Orders:** Uses `PurchaseTable`, a raw HTML `<table>` implementation.
- **Goods Received Notes (GRN):** Also built on static tables.
- **Vendor Specific Tables:** Suffer from the same legacy markup issues as the global ledgers.

### Limitations
- **Sorting & Filtering:** No native column sorting. Filters are clunky and limited to simple text matching and dropdowns.
- **Data Density:** Low. The lack of `DataTable` density toggle means fewer rows fit on screen.
- **Loading/Empty States:** Functional but inconsistent with the rest of the application.

---

## 3. Purchasing Workflows

### Current UX
- **Create Purchase Order:** Relies on navigating to a heavy, full-page `purchase-create-view`.
- **Receive Goods:** Handled via `goods-received-note-form`, requiring context-switching from the main ledger.
- **Approvals:** Not surfaced cleanly. Approvers must manually filter the table for `pending_approval`.

### Navigation Friction
- The rigid separation between POs and GRNs creates silos. Procurement officers lack a unified view of what was ordered vs. what arrived.
