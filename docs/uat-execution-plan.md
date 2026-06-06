# UAT Execution Plan

**Objective:** Validate that the ERP Frontend Redesign functions correctly across all primary user roles in a staging environment prior to production deployment.

---

### System Administrator
**Test Scenarios:**
- Login and navigate to the Global Dashboard.
- Navigate to Settings -> Organization Members. Update a member's role.
- Navigate to Reports. Select a global "Tax" report and trigger an export.

**Success Criteria:**
- Dashboard renders full organization KPIs.
- Role update completes without layout breaks.
- Report generates and downloads successfully.

**Sign-Off:** ___________________________  **Date:** ___________

---

### Accountant
**Test Scenarios:**
- Navigate to Accounting -> Transactions. Use the "Exception" tab to isolate records.
- Use the Filter Bar to search for a specific counterparty (e.g., "Acme Corp").
- Navigate to Bank Reconciliation and ensure the legacy view still renders ledger lines.

**Success Criteria:**
- Transactions instantly filter client-side.
- Bank Reconciliation loads without crashing.

**Sign-Off:** ___________________________  **Date:** ___________

---

### Sales Representative
**Test Scenarios:**
- Navigate to Sales Dashboard. Verify Revenue trends.
- Navigate to Invoices. Click a column header (e.g., "Amount") to sort ascending/descending.
- Search for a Customer by ID.

**Success Criteria:**
- DataTable sorts numerically and alphabetically without error.
- Dashboard SVG renders without blocking the main thread.

**Sign-Off:** ___________________________  **Date:** ___________

---

### Purchasing Agent
**Test Scenarios:**
- Navigate to Purchasing. Check the Vendor Performance widget.
- Navigate to Purchase Orders. Ensure "Pending Approval" badges are styled correctly (Warning/Amber).
- Expand a row or click to view a specific PO.

**Success Criteria:**
- Badges strictly follow semantic colors.
- Alerts widget correctly fires for late deliveries.

**Sign-Off:** ___________________________  **Date:** ___________

---

### Inventory Manager
**Test Scenarios:**
- Navigate to Inventory Dashboard. Identify "Low Stock" exceptions in the Action List.
- Search the `InventoryItemsTable` using rapid keystrokes to ensure UI remains responsive.

**Success Criteria:**
- Action List routing works.
- Search input gracefully filters results (with Hotfix 1 debouncing active).

**Sign-Off:** ___________________________  **Date:** ___________
