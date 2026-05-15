# User Acceptance Testing (UAT) Checklist

## 1. System Administrator
**Focus:** Organization Management, User Provisioning, System Config

| Test Scenario | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **Role Assignment** | 1. Navigate to Settings > Team<br>2. Change a user's role to 'Accountant'<br>3. Save | The user's role updates in the DataTable immediately. | [ ] |
| **Global Dashboard** | 1. Navigate to Home<br>2. View KPIs and Charts | All top-level revenue, expense, and inventory metrics render cleanly. | [ ] |
| **Report Generation** | 1. Navigate to Reports<br>2. Filter by "Operations"<br>3. Click "Generate" on Inventory Report | Status transitions to Queued -> Ready. CSV successfully downloads. | [ ] |

## 2. Accountant
**Focus:** Ledger Accuracy, Payment Tracking, Reporting

| Test Scenario | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **Filter Transactions** | 1. Navigate to Accounting > Transactions<br>2. Click the "Exception" Quick Status Tab | The DataTable isolates only exception rows immediately. | [ ] |
| **Review Expenses** | 1. Navigate to Accounting > Expenses<br>2. Search for "Payroll" | Table filters rows; text remains highly readable in Dark Mode. | [ ] |
| **Bank Reconciliation** | 1. Navigate to Accounting > Bank Recon<br>2. View Ledger vs Statement | Side-by-side legacy view renders correctly without layout breaks. | [ ] |

## 3. Sales Representative
**Focus:** Customer CRM, Invoice Generation, Sales Tracking

| Test Scenario | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **Sales Dashboard** | 1. Navigate to Sales<br>2. View Top KPIs | Outstanding Receivables and Revenue charts load successfully. | [ ] |
| **Invoice Ledger** | 1. Navigate to Sales > Invoices<br>2. Filter Date Range | DataTable truncates list to the specified timeframe. | [ ] |
| **Customer Detail** | 1. Navigate to Sales > Customers<br>2. Click view action on a row | Navigates to the detailed customer view. | [ ] |

## 4. Purchasing Agent
**Focus:** Vendor Tracking, Order Approvals, Lead Times

| Test Scenario | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **PO Filtering** | 1. Navigate to Purchasing > Orders<br>2. Search Vendor Name | Table instantly filters POs. | [ ] |
| **Vendor Widget** | 1. View Purchasing Dashboard<br>2. Check AlertWidget | Vendor Late Delivery alerts are visible and actionable. | [ ] |
| **GRN Tracking** | 1. View Goods Received table<br>2. Sort by Date | Rows sort chronologically client-side. | [ ] |

## 5. Inventory Manager
**Focus:** Stock Levels, Valuations, Warehousing

| Test Scenario | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **Stock Search** | 1. Navigate to Inventory<br>2. Search SKU "RAW-1" | DataTable isolates specific materials instantly. | [ ] |
| **Stock Alerts** | 1. View Inventory Dashboard | Low stock items populate the Exceptions/Alerts list. | [ ] |
| **Transfers** | 1. Navigate to Transfers<br>2. Validate table status badges | Badges correctly display Success/Warning states. | [ ] |
