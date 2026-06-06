# Reports Module Audit

## Current Architecture
The `ReportsView` serves as a very rudimentary export hub, providing four hardcoded `ReportExportCard` components for "Sales", "Inventory", "Tax", and "Expenses". It acts strictly as an interface to the `useExport` hook which polls the backend for CSV generation.

## 1. Export Flows & Background Jobs
- **Strengths:** The `useExport` hook securely manages long-running backend jobs (polling for "queued" -> "completed" statuses) and gracefully offers a direct download link without blocking the UI.
- **Weaknesses:** The UX for tracking the export progress is confined entirely within the individual card. If the user navigates away, they lose sight of the export progress.

## 2. Discoverability & Organization
- **Strengths:** Simple, straightforward layout.
- **Weaknesses:** As the ERP grows, hardcoding individual `Card` elements for every single report will rapidly become unmanageable. There is no search, categorization, or filtering capability for the reports.

## 3. Financial visibility
- **Weaknesses:** The Reports page is purely functional (exporting CSVs). It lacks any immediate "at-a-glance" financial metrics. A user coming to generate a revenue report has no immediate indication of what the revenue actually is until they download and open the CSV.

## 4. Accessibility & Print Views
- **Weaknesses:** There are no in-browser print views or PDF generation options directly exposed on the cards. High reliance on external spreadsheet software to actually view the data.
