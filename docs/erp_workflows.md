# Precision Ledger ERP — Complete Workflow Catalogue

> This document maps every supported workflow in the system across all modules, covering user-facing flows, system-level async jobs, background infrastructure, and cross-module dependencies.

---

## 1. Authentication & Identity

### 1.1 User Registration
1. User submits name, email, password → `POST /auth/register`
2. Account created with `isVerified: false`
3. Email verification token generated → Verification email dispatched via queue
4. User lands on a "Check your inbox" screen

### 1.2 Email Verification
1. User clicks link in verification email → `GET /auth/verify-email?token=...`
2. Token validated and expired if used
3. User `isVerified` flipped to `true`
4. User can now fully access the platform

### 1.3 Login
1. User submits email + password → `POST /auth/login`
2. Credentials verified; `bcrypt` hash compared
3. Short-lived **access token** (JWT) + long-lived **refresh token** issued
4. Refresh token stored in `RefreshSession` table with device/IP metadata
5. Tokens returned as HTTP-only cookies

### 1.4 Token Refresh
1. Client sends expired access token + valid refresh cookie → `POST /auth/refresh`
2. Refresh session verified (not revoked, not expired)
3. New access token issued; refresh token rotated

### 1.5 Logout (Single Session)
1. User calls `POST /auth/logout`
2. Current `RefreshSession` revoked in DB

### 1.6 Logout All Sessions
1. User calls `POST /auth/logout-all`
2. Every `RefreshSession` for that user revoked (useful on password change / security incident)

### 1.7 Forgot Password
1. User submits email → `POST /auth/forgot-password`
2. `PasswordResetToken` created (time-limited)
3. Password reset email dispatched via queue

### 1.8 Reset Password
1. User clicks link → submits new password → `POST /auth/reset-password`
2. Token validated; password re-hashed; all refresh sessions revoked for security

### 1.9 Update Profile
1. Authenticated user submits updated name → `PATCH /auth/me`
2. User record updated; existing sessions preserved

### 1.10 Email Change (Two-Factor Verification)
1. User requests change → `POST /auth/email-change/request` with new email
2. OTP sent to **current** email (security alert) and **new** email (confirmation)
3. User submits OTP → `POST /auth/email-change/verify`
4. Email address updated; all sessions optionally invalidated

### 1.11 Workspace Switching
1. User has multiple organization memberships
2. Calls `POST /auth/switch-workspace` with target organizationId
3. New access token issued scoped to the new organization context
4. All subsequent requests run in the new tenant scope

---

## 2. Organization & Multi-Tenancy

### 2.1 Create Organization
1. Authenticated user submits org name → `POST /organizations`
2. Organization created with unique slug + unique join code
3. Creator automatically assigned the system **Owner** role
4. Default roles (Owner, Admin, Member) seeded for the org

### 2.2 List My Organizations
1. `GET /organizations` returns all orgs the current user belongs to

### 2.3 View Organization Details
1. `GET /organizations/:id` with `organization.view` permission
2. Returns name, slug, logo, settings, member count

### 2.4 Update Organization Settings
1. Admin/Owner submits updated settings → `PATCH /organizations/:id`
2. Requires `organization.update` permission
3. Name, logo, settings JSON updatable

### 2.5 Delete Organization
1. Owner calls `DELETE /organizations/:id`
2. Requires `organization.delete` permission + `owner` role
3. Soft-delete cascades across all tenant data

### 2.6 Leave Organization
1. Member calls `POST /organizations/:id/leave`
2. Member record removed; owner cannot leave (must transfer first)

### 2.7 Transfer Ownership
1. Owner submits new owner userId → `POST /organizations/:id/transfer-ownership`
2. Requires `ownership.transfer` permission + `owner` role
3. Previous owner downgraded to Admin; new owner assigned Owner role

---

## 3. Member Invitations & Join Requests

### 3.1 Invite a Member by Email
1. Admin/Owner submits email + roleId → `POST /organizations/:id/members/invite`
2. Requires `member.invite` permission
3. `Invitation` record created with expiring token
4. Invitation email dispatched via BullMQ queue

### 3.2 Accept Invitation
1. Invitee receives email with link containing token
2. Calls `POST /invitations/accept` (no auth required)
3. Token validated (not expired, not previously accepted)
4. User account auto-created if not registered, or matched if existing
5. `OrganizationMember` record created with the assigned role
6. Invitation marked `acceptedAt`

### 3.3 Manage Members
- **List Members**: `GET /organizations/:id/members` → requires `member.view`
- **Update Role**: `PATCH /organizations/:id/members/:memberId` → requires `member.update`
- **Remove Member**: `DELETE /organizations/:id/members/:memberId` → requires `member.remove`

### 3.4 Join via Join Code
1. User submits join code → `POST /organizations/join`
2. `JoinRequest` created with status `PENDING`
3. Owner/Admin reviews pending requests

### 3.5 Approve / Reject Join Request
- `POST /organizations/:id/join-requests/:requestId/approve` → member added
- `POST /organizations/:id/join-requests/:requestId/reject` → request rejected
- Both require `owner` or `admin` role

---

## 4. RBAC — Roles & Permissions

### 4.1 Create Custom Role
1. Admin calls `POST /roles` with name + description + permission list
2. Requires `roles.create` permission
3. Custom role associated to organization

### 4.2 Assign Permissions to Role
1. Role updated via `PATCH /roles/:id` with a new permission set
2. All members with that role immediately inherit the change

### 4.3 Archive / Restore Role
- `POST /roles/:id/archive` → role soft-archived (cannot be assigned)
- `POST /roles/:id/restore` → role made active again
- Both require `roles.update` permission

### 4.4 Delete Role
1. `DELETE /roles/:id` → hard-delete if no active members
2. Requires `roles.delete` permission

### 4.5 List Available Permissions
1. `GET /roles/permissions` → returns full permission catalogue
2. Used by admin UI to build role assignment forms

---

## 5. Customer Management

### 5.1 Create Customer
1. Sales team submits customer details (name, email, phone, GST, address, credit limit)
2. `POST /customers` → requires `customers.create`
3. Customer record created, tied to current organization

### 5.2 View Customer Ledger
1. `GET /customers/:id/ledger` → requires `customers.view`
2. Returns all invoices + payments for that customer
3. Calculates outstanding balance

### 5.3 Update Customer
1. `PATCH /customers/:id` → requires `customers.update`
2. All fields except ID are updatable

### 5.4 Archive Customer
1. `DELETE /customers/:id` → requires `customers.update`
2. Soft-delete; historical invoices preserved

---

## 6. Vendor Management

### 6.1 Create Vendor
1. Finance team submits vendor details (name, email, phone, GST, address)
2. `POST /vendors` → requires `vendors.create`

### 6.2 View Vendor Ledger
1. `GET /vendors/:id/ledger` → requires `vendors.view`
2. Returns all expenses linked to this vendor + running balance

### 6.3 Update / Archive Vendor
- `PATCH /vendors/:id` → `vendors.update`
- `DELETE /vendors/:id` → soft-delete via `vendors.update`

---

## 7. Product & Category Catalogue

### 7.1 Create Product Category
1. `POST /products/categories` → requires `products.create`
2. Category scoped to organization; used to group products

### 7.2 Create Product
1. Admin submits product details (name, SKU, price, type, category, tax)
2. `POST /products` → requires `products.create`
3. For `PHYSICAL` type: an `InventoryItem` record is auto-created with `quantity: 0`

### 7.3 Update / Archive Product
- `PATCH /products/:id` → `products.update`
- `DELETE /products/:id` → soft-archive; historical invoice items preserved

### 7.4 Update / Archive Category
- `PATCH /products/categories/:id` → `products.update`
- `DELETE /products/categories/:id` → soft-archive

---

## 8. Invoice (Sales) Lifecycle

### 8.1 Create Draft Invoice
1. Sales rep selects customer, issue date, line items (product + qty + optional overrides)
2. `POST /invoices` → requires `sales.create`
3. System auto-calculates: `subtotal`, `taxAmount`, `discountAmount`, `totalAmount`
4. Invoice number auto-assigned from `InvoiceSequence` (atomic increment in transaction)
5. `Transaction` record created (`SALE` type)
6. Invoice saved as `DRAFT`; no inventory impact yet

### 8.2 Issue Invoice (Draft → Issued)
1. Sales rep calls `PATCH /invoices/:id` with `status: "ISSUED"`
2. Requires `sales.update`
3. For `PHYSICAL` products: stock decremented; `InventoryMovement` (`SALE`) recorded
4. Insufficient stock → `400 Bad Request`
5. PDF generation enqueued in `pdfGenerationQueue` (BullMQ)

### 8.3 Export Invoice PDF (Synchronous)
1. `GET /invoices/:id/pdf` → requires `sales.export`
2. `pdfkit` generates PDF buffer on-demand
3. Includes: org name, invoice number, issue/due date, customer details, line items table, totals, notes
4. Returned as `application/pdf` with `Content-Disposition: attachment`

### 8.4 Send Invoice via Email
1. User enters recipient email → `POST /invoices/:id/send` → requires `sales.send`
2. `InvoiceEmailLog` created with `status: PENDING`
3. PDF generated synchronously
4. Email dispatched with PDF as attachment via `DirectMailDispatcher`
5. Log updated to `SENT` on success or `FAILED` with error message
6. Customer receives a professional HTML email with the PDF attachment

### 8.5 View Invoice Email History
1. `GET /invoices/:id/email-history` → requires `sales.view`
2. Returns list of `InvoiceEmailLog` records (recipient, status, sentAt, error)
3. Allows support team to confirm delivery

### 8.6 Record Payment Against Invoice
→ See **Payment Workflow** (Section 10)

### 8.7 Cancel Invoice
1. `PATCH /invoices/:id` with `status: "CANCELLED"`
2. Requires `sales.update`

### 8.8 Delete Invoice
1. `DELETE /invoices/:id` → requires `sales.delete`
2. Only `DRAFT` invoices can be deleted (hard business rule)

---

## 9. Payment Collection

### 9.1 Record Payment
1. Finance team submits: invoiceId, amount, paymentDate, method (CASH/UPI/CARD/BANK_TRANSFER/CHEQUE/OTHER), reference
2. `POST /payments` → requires `finance.create`
3. Payment linked to invoice; `paidAmount` on invoice recalculated
4. Invoice status auto-updated: `PARTIALLY_PAID` or `PAID`
5. `Transaction` record created (`PAYMENT` type)

### 9.2 List Payments
1. `GET /payments` → requires `finance.view`
2. Supports pagination; filterable

### 9.3 Delete / Void Payment
1. `DELETE /payments/:id` → requires `finance.delete`
2. Payment removed; invoice balance recalculated back to unpaid

---

## 10. Expense Management (Purchasing)

### 10.1 Record Expense
1. Finance team submits: amount, category, date, description, optional vendor
2. `POST /expenses` → requires `finance.create`
3. Categories: `SALARY, RENT, UTILITIES, MARKETING, TRAVEL, SOFTWARE, OTHER`
4. `Transaction` record created (`EXPENSE` type)

### 10.2 View / Update / Delete Expense
- `GET /expenses` → list with pagination (`finance.view`)
- `GET /expenses/:id` → single record
- `PATCH /expenses/:id` → update (`finance.update`)
- `DELETE /expenses/:id` → soft-delete (`finance.delete`)

---

## 11. Inventory Management

### 11.1 View Inventory Items
1. `GET /inventory/items` → requires `inventory.view`
2. Returns all products with current stock levels, reorder levels

### 11.2 View Stock Movements
1. `GET /inventory/movements` → requires `inventory.view`
2. Full audit trail: PURCHASE, SALE, ADJUSTMENT, RETURN, TRANSFER

### 11.3 Manual Stock Adjustment
1. Warehouse team submits: productId, quantity delta (positive or negative), reason
2. `POST /inventory/adjustments` → requires `inventory.update`
3. `InventoryMovement` recorded with type `ADJUSTMENT`

### 11.4 Stock Transfer
1. Submit: productId, from location, to location, quantity
2. `POST /inventory/transfers` → requires `inventory.update`
3. `InventoryMovement` recorded with type `TRANSFER`

### 11.5 Auto Stock Decrement (Invoice Issued)
> This is a **system-triggered** workflow, not user-initiated.
1. When an invoice is issued (Section 8.2), for each `PHYSICAL` product line item:
2. Stock quantity decremented atomically in the same DB transaction
3. `SALE` movement recorded
4. Pre-issue stock check: insufficient stock → entire invoice issuance rolled back

---

## 12. Tax Configuration

### 12.1 Create Tax Rate
1. Finance/Admin submits: name, rate (%), type (GST/VAT/SALES_TAX/OTHER), isDefault
2. `POST /taxes` → requires `finance.create`
3. Tax can be applied to products; used in invoice line item calculations

### 12.2 Update Tax Rate
1. `PATCH /taxes/:id` → `finance.update`
2. Changes affect new invoices; existing invoices retain their baked-in tax amounts

### 12.3 Archive Tax
1. `DELETE /taxes/:id` → `finance.delete` (soft-delete)
2. Products using this tax retain the reference; future products cannot select it

---

## 13. Financial Reports

### 13.1 Dashboard Report
1. `GET /reports/dashboard` → requires `reports.view`
2. Returns: total revenue, total expenses, net profit, top customers, recent activity

### 13.2 Sales Report
1. `GET /reports/sales?startDate=&endDate=` → requires `reports.view`
2. Aggregated invoice data over a date range: totals, averages, status breakdown

### 13.3 Expense Report
1. `GET /reports/expenses?startDate=&endDate=` → requires `reports.view`
2. Expense totals by category over a date range

### 13.4 Inventory Report
1. `GET /reports/inventory` → requires `reports.view`
2. Current stock levels, low-stock alerts (below reorder level), valuation

### 13.5 Tax Report
1. `GET /reports/tax?startDate=&endDate=` → requires `reports.view`
2. Tax collected by rate across invoices in the period

### 13.6 Async Report Export (CSV)
1. User submits export job → `POST /reports/export` → requires `reports.export`
2. Job payload: `reportType`, `startDate`, `endDate`, `frequency` (raw/daily/weekly/monthly)
3. BullMQ job enqueued in `reportQueue`; job ID returned immediately
4. **Background**: Worker fetches data with cursor pagination (batches of 1,000 rows)
5. **Aggregation**: For weekly/monthly frequency, data bucketed and summarized
6. CSV built in-memory; uploaded to storage (local or S3)
7. Signed download URL generated (7-day expiry)
8. Export-ready email dispatched to requesting user via `mailQueue`
9. Client polls `GET /reports/export/:jobId` to get status + download URL

---

## 14. Audit Logs

### 14.1 View Audit Trail
1. `GET /organizations/:id/audit-logs` → requires `audit.read`
2. Returns every recorded action: `INVOICE_CREATED`, `INVOICE_UPDATED`, `INVOICE_DELETED`, etc.
3. Each entry: actorUserId, action, entityType, entityId, metadata, timestamp
4. Provides a full, tamper-evident change history for compliance

---

## 15. Background Queue Workflows (BullMQ)

These run asynchronously and are invisible to the end user but are critical to system operation.

### 15.1 Mail Queue (`mail-queue`)
- **Triggers**: Any email dispatch in the system
- **Jobs**: `send-verification`, `send-password-reset`, `send-invitation`, `send-invoice`, `send-export`, `send-email-change-current`, `send-email-change-new`
- **Worker**: Routes each job to the correct `MailDispatcher` method; attaches PDF buffers for invoice emails
- **Failure**: Logged to `EmailLog` with `status: FAILED` and error message

### 15.2 PDF Generation Queue (`pdf-generation-queue`)
- **Triggers**: Invoice status changed to `ISSUED`
- **Job**: `generate-invoice-pdf` with `{ documentId, documentType, organizationId }`
- **Worker** (`pdf.job.ts`): Fetches invoice data → generates PDF with `pdfkit` → uploads to storage → enqueues invoice email to mail queue
- **Storage path**: `organizations/{orgId}/invoices/{invoiceNumber}.pdf`

### 15.3 Report Export Queue (`report-queue`)
- **Triggers**: User initiates export from reports page
- **Job**: Report type + date range + frequency + userId
- **Worker** (`report-export.job.ts`): Streams DB records in 1,000-row batches → optionally aggregates by period → generates CSV → uploads to storage → enqueues download email
- **Storage path**: `organizations/{orgId}/exports/reports/{type}-{timestamp}.csv`

### 15.4 Storage Cleanup Queue
- **Triggers**: Scheduled or on file deletion requests
- **Worker** (`storage-cleanup.job.ts`): Removes orphaned files from local/S3 storage

### 15.5 Audit Export Queue (`audit-queue`)
- **Triggers**: Admin requests audit log export
- **Worker** (`audit-export.job.ts`): Fetches audit records and streams to file

---

## 16. Storage Workflows

### 16.1 Local Storage (Development)
- Files stored in `./uploads` directory
- Configured via `STORAGE_PROVIDER=local`, `STORAGE_LOCAL_PATH`
- Signed "URLs" generated as local paths

### 16.2 S3 Storage (Production)
- Files stored in AWS S3 (or compatible, e.g., MinIO)
- Configured via `STORAGE_PROVIDER=s3`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Pre-signed URLs generated with expiry (default 7 days for exports)

---

## 17. Cross-Module Workflows (End-to-End Scenarios)

### 17.1 Full Sales Order-to-Cash Cycle
```
Create Customer
    ↓
Create Product (PHYSICAL or SERVICE)
    ↓
Configure Tax Rate
    ↓
Create Invoice (DRAFT)
    ↓
Issue Invoice → Auto-deduct stock (PHYSICAL only) → Queue PDF generation
    ↓
Customer receives emailed PDF
    ↓
Record Payment → Invoice marked PAID
    ↓
Transaction recorded → Reflected in Sales Report + Dashboard
```

### 17.2 Expense-to-Report Cycle
```
Create Vendor
    ↓
Record Expense (linked to vendor)
    ↓
Transaction recorded (EXPENSE type)
    ↓
Finance team views Expense Report
    ↓
Exports CSV via async report queue
    ↓
Download link emailed to user
```

### 17.3 New Team Member Onboarding
```
Owner creates custom Role with appropriate permissions
    ↓
Owner invites new member by email
    ↓
Invitation email dispatched (BullMQ)
    ↓
Invitee clicks link → Account created or matched → Member added to org
    ↓
Member can now access permitted modules based on their role
```

### 17.4 Stock Replenishment Workflow
```
View Inventory Report → identify low-stock products
    ↓
Record Expense for purchase cost (linked to vendor)
    ↓
Manual Stock Adjustment → quantity increased
    ↓
ADJUSTMENT movement logged
    ↓
Inventory Report updated with new levels
```

### 17.5 Invoice Email Re-Send & Delivery Audit
```
Open Invoice Details page
    ↓
Actions ▼ → Send Email → enter recipient
    ↓
InvoiceEmailLog created (PENDING)
    ↓
PDF generated → Email sent with PDF attached
    ↓
InvoiceEmailLog updated (SENT / FAILED)
    ↓
Actions ▼ → View Email History → confirm delivery
```

---

## 18. Permission Matrix Summary

| Module | View | Create | Update | Delete | Special |
|---|---|---|---|---|---|
| **Auth** | — | — | — | — | Login, Refresh, Verify |
| **Organization** | `organization.view` | *(any user)* | `organization.update` | `organization.delete` | `ownership.transfer` |
| **Members** | `member.view` | `member.invite` | `member.update` | `member.remove` | — |
| **Roles** | `roles.view` | `roles.create` | `roles.update` | `roles.delete` | — |
| **Audit Logs** | `audit.read` | — | — | — | — |
| **Customers** | `customers.view` | `customers.create` | `customers.update` | `customers.update` | Ledger view |
| **Vendors** | `vendors.view` | `vendors.create` | `vendors.update` | `vendors.update` | Ledger view |
| **Products** | `products.view` | `products.create` | `products.update` | `products.delete` | Categories |
| **Inventory** | `inventory.view` | — | `inventory.update` | — | Adjustments, Transfers |
| **Invoices** | `sales.view` | `sales.create` | `sales.update` | `sales.delete` | `sales.export`, `sales.send` |
| **Payments** | `finance.view` | `finance.create` | — | `finance.delete` | — |
| **Expenses** | `finance.view` | `finance.create` | `finance.update` | `finance.delete` | — |
| **Taxes** | `finance.view` | `finance.create` | `finance.update` | `finance.delete` | — |
| **Reports** | `reports.view` | — | — | — | `reports.export` |

---

*Last updated: June 2026 · Precision Ledger ERP*
