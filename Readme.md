# Precision Ledger ERP

> A production-oriented, multi-tenant ERP platform for accounting, inventory, purchasing, sales, approvals, and HRMS — built as a full-stack TypeScript application.

[![CI Pipeline](https://github.com/hardik-agarwal18/erp/actions/workflows/ci.yml/badge.svg)](https://github.com/hardik-agarwal18/erp/actions/workflows/ci.yml)

---

## Overview

**Precision Ledger ERP** is a full-stack ERP/SaaS application designed around organization-based multi-tenancy. It brings together financial operations, inventory, procurement, human resources, approvals, reporting, auditability, and workspace administration behind a granular RBAC model.

The backend follows a layered domain-driven architecture:

```text
HTTP Request
    ↓
Middleware
    ↓
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Prisma / PostgreSQL
```

The system also uses Redis and BullMQ for sessions, caching, idempotency, background jobs, exports, email delivery, and asynchronous workloads. Prometheus and OpenTelemetry provide observability.

---

## Why This Project Is Interesting

This is intentionally more than a collection of CRUD screens. Several modules participate in real business workflows and enforce consistency across boundaries.

### Highlights

- Multi-tenant organization isolation.
- Granular RBAC with system and custom roles.
- Secure authentication with JWT access/refresh tokens.
- Refresh-token rotation.
- CSRF protection.
- Redis-backed token blacklisting and session management.
- Sales-to-cash workflows.
- Procure-to-pay workflows.
- Double-entry accounting.
- Inventory and warehouse management.
- Batch and serial number tracking.
- Goods Receipt Notes and Delivery Challans.
- Configurable approval workflows.
- HRMS and payroll.
- Asynchronous report exports.
- PDF invoice generation.
- Email delivery through background queues.
- Audit logging.
- Idempotency protection for critical writes.
- Structured logging.
- Prometheus metrics.
- OpenTelemetry tracing.
- Docker-based infrastructure.
- Automated CI with unit, integration, build, security and E2E checks.

---

# Core Modules

| Area | Capabilities |
|---|---|
| **IAM & Security** | Registration, email verification, login, refresh/logout, password reset, workspace switching, invitations, organizations, roles, permissions |
| **Customers & Vendors** | Customer/vendor management, ledgers, search, archival |
| **Products** | Product catalogue, categories, pricing, tax configuration, physical/service products |
| **Inventory** | Stock, movements, adjustments, transfers, godowns, GRNs, delivery challans, batches, serials, verification |
| **Sales & Billing** | Invoices, line items, taxes, payments, PDF generation and email |
| **Finance** | Transactions, payments, expenses, taxes and financial reporting |
| **Accounting** | Chart of Accounts, journal entries, fiscal years and Trial Balance |
| **Purchasing** | Purchase orders, approvals, goods receipt and vendor invoices |
| **HRMS** | Employees, departments, designations, attendance, leaves, shifts, holidays and payroll |
| **Approvals** | Configurable multi-step approval workflows |
| **Reports** | Dashboard, sales, expense, inventory and tax reports |
| **Platform** | Health checks, queues, metrics, tracing and structured logging |

---

# High-Level Architecture

```text
┌────────────────────────────────┐
│       Next.js 15 Frontend      │
│                                │
│ React 19 • React Query         │
│ Tailwind • Radix UI • Recharts │
└───────────────┬────────────────┘
                │
                │ HTTP / JSON
                ▼
┌───────────────────────────────────────────┐
│              Express 5 API                │
│                                           │
│ Auth • Tenant • RBAC • Validation         │
│ Rate Limit • Sanitization • Idempotency   │
└───────────────────┬───────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────┐
│             Domain Services               │
│                                           │
│ IAM • Inventory • Financials • HRMS       │
│ Purchasing • Contacts • Reports           │
│ Approvals                                  │
└───────────────┬───────────────┬───────────┘
                │               │
                ▼               ▼
      ┌────────────────┐   ┌──────────────┐
      │ Prisma         │   │ Redis        │
      │ PostgreSQL     │   │ Sessions     │
      │ Transactions   │   │ Cache / MQ   │
      └────────────────┘   └──────┬───────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │ BullMQ       │
                           │ Workers      │
                           └──────┬───────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          Mail / SMTP        PDF / Storage      Report Exports


Observability
─────────────────────────────────────────────────────
Pino Logs • Prometheus Metrics • OpenTelemetry Traces
Grafana • Tempo • Queue Monitoring
```

---

# Technology Stack

## Frontend

- **Next.js 15**
- **React 19**
- **TypeScript**
- **TanStack Query**
- **TanStack Table**
- **Tailwind CSS**
- **Radix UI**
- **React Hook Form**
- **Zod**
- **Recharts**
- **Axios**
- **Cypress**
- **ESLint**

## Backend

- **Node.js 20**
- **Express 5**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **BullMQ**
- **Zod**
- **JWT**
- **bcrypt**
- **Nodemailer**
- **PDFKit**
- **Pino**
- **prom-client**
- **OpenTelemetry**
- **AWS SDK / S3-compatible storage**

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7
- Prometheus
- Grafana
- Grafana Tempo
- GitHub Actions
- Vercel-compatible Next.js deployment

---

# Multi-Tenancy

The application uses a **shared PostgreSQL schema with organization-based tenant isolation**.

Tenant-owned entities contain an `organizationId`, and the backend applies tenant context before executing business operations.

Conceptually:

```text
User
 │
 ├── OrganizationMember
 │          │
 │          ▼
 │    Organization
 │          │
 │          ├── Customers
 │          ├── Vendors
 │          ├── Products
 │          ├── Inventory
 │          ├── Invoices
 │          ├── Payments
 │          ├── Accounting
 │          ├── Purchases
 │          ├── Employees
 │          └── Reports
```

### Tenant Resolution

Tenant context can be resolved through:

1. `x-organization-id`
2. Route parameters where supported
3. Organization context attached to the authenticated user/JWT

The repository layer additionally scopes tenant-owned operations.

### Important

The current implementation uses **application-level tenant isolation**.

PostgreSQL Row-Level Security (RLS) is **not currently enabled**.

---

# Authentication & Security

The authentication system includes several production-oriented safeguards.

### Registration

```text
Register
   ↓
Validate Input
   ↓
Hash Password with bcrypt
   ↓
Create User
   ↓
Generate Verification Token
   ↓
Send Verification Email
```

### Login

```text
Email + Password
       ↓
Credential Validation
       ↓
Verified User Check
       ↓
Organization Membership
       ↓
JWT Access Token
       +
Refresh Token
       +
CSRF Token
```

### Security Features

- bcrypt password hashing.
- Short-lived access tokens.
- Long-lived refresh tokens.
- Database-backed refresh sessions.
- Refresh-token rotation.
- CSRF double-submit protection.
- Redis token blacklisting.
- Session revocation.
- Logout from all sessions.
- Email verification.
- Password reset.
- Email-change verification.
- HTTP security headers using Helmet.
- Rate limiting.
- Request sanitization.
- Zod request validation.
- Request IDs for logging.

### Token Lifecycle

```text
Access Token
    │
    └── short-lived

Refresh Token
    │
    ├── stored in database
    ├── cached in Redis
    └── rotated on refresh
```

---

# RBAC & Authorization

The ERP uses organization-scoped Role-Based Access Control.

System roles include:

- **Owner**
- **Admin**
- **Manager**
- **Member**

Organizations can also create custom roles and assign granular permissions.

Example:

```text
Role
 │
 ├── customers.view
 ├── customers.create
 ├── invoices.view
 ├── invoices.create
 ├── inventory.view
 ├── inventory.update
 └── reports.view
```

Authorization is enforced on the backend and permission-aware UI behavior is also supported in the frontend.

---

# Sales-to-Cash Workflow

One of the main cross-module workflows is the sales lifecycle.

```text
Create Customer
       ↓
Create Product
       ↓
Configure Tax
       ↓
Create Invoice
       ↓
DRAFT
       ↓
Issue Invoice
       │
       ├── Validate Stock
       ├── Decrement Physical Inventory
       ├── Record Inventory Movement
       ├── Record Financial Transaction
       └── Queue PDF Generation
       ↓
Send Invoice
       ↓
Record Payment
       │
       ├── Update Paid Amount
       ├── Update Invoice Status
       └── Record Payment Transaction
       ↓
Financial Reports
```

Invoice status can progress through states such as:

```text
DRAFT
  ↓
ISSUED
  ↓
PARTIALLY_PAID
  ↓
PAID
```

---

# Invoice Management

Invoices support:

- Customer association.
- Multiple line items.
- Product selection.
- Quantity.
- Unit-price overrides.
- Discounts.
- Automatic tax calculation.
- Invoice numbering.
- Draft invoices.
- Invoice issuance.
- Inventory integration.
- Payment reconciliation.
- PDF generation.
- Email delivery.
- Email delivery history.
- Soft deletion for drafts.

Invoice numbering is organization-scoped and uses an atomic sequence mechanism.

---

# Payment Management

Payments are linked to invoices.

When a payment is recorded:

```text
Payment
   ↓
Validate Invoice
   ↓
Create Payment
   ↓
Calculate Total Paid
   ↓
Update Invoice Status
   ↓
Create Financial Transaction
   ↓
Audit Event
```

The system prevents the total paid amount from exceeding the invoice total.

---

# Inventory Management

Inventory is implemented as a dedicated domain.

Supported functionality includes:

- Product catalogue.
- Product categories.
- Physical products.
- Service products.
- Stock quantities.
- Reorder levels.
- Manual stock adjustments.
- Stock movement history.
- Warehouses / godowns.
- Inter-godown transfers.
- Goods Receipt Notes.
- Delivery Challans.
- Stock verification.
- Batch tracking.
- Serial number tracking.
- Stock groups.
- Weighted-average costing.

### Inventory Movement Types

Examples include:

```text
PURCHASE
SALE
ADJUSTMENT
RETURN
TRANSFER
```

Critical stock changes use database transactions to keep related state consistent.

---

# Goods Receipt Notes

GRNs represent inbound inventory.

A simplified workflow:

```text
Purchase Order
      ↓
Goods Received
      ↓
GRN
      ↓
Validate Items
      ↓
Update Inventory
      ↓
Track Batch / Serial
      ↓
Calculate Weighted Average Cost
      ↓
Update Purchase Order Status
```

---

# Delivery Challans

Delivery Challans support outbound dispatch workflows.

They integrate with:

- Customers.
- Products.
- Inventory.
- Serial numbers.
- Stock movement tracking.

---

# Warehouse / Godown Management

Inventory can be managed across multiple storage locations.

The system supports:

- Godown creation.
- Godown management.
- Stock transfers.
- Stock journals.
- Location-aware inventory.
- Transfer movement history.

---

# Batch & Serial Tracking

Products can be configured for:

```text
Batch Tracking
       OR
Serial Tracking
```

Batch tracking supports lot-level inventory management while serial tracking provides unit-level traceability.

This is particularly useful for products where individual-unit identification or lot tracking is required.

---

# Physical Stock Verification

The inventory verification system allows physical stock counts to be compared against system quantities.

```text
System Quantity
       +
Physical Count
       ↓
Calculate Variance
       ↓
Reconcile Inventory
       ↓
Create Adjustment / Movement
```

This provides an auditable mechanism for stock reconciliation.

---

# Accounting

The accounting module provides double-entry bookkeeping functionality.

## Chart of Accounts

Organizations are provisioned with system accounts such as:

| Code | Account | Type |
|---|---|---|
| `1000` | Cash | Asset |
| `1010` | Bank | Asset |
| `1200` | Accounts Receivable | Asset |
| `1300` | Inventory | Asset |
| `2000` | Accounts Payable | Liability |
| `2100` | Tax Payable | Liability |
| `3000` | Owner's Equity | Equity |
| `3100` | Retained Earnings | Equity |
| `4000` | Sales Revenue | Revenue |
| `4100` | Other Income | Revenue |
| `5000` | Cost of Goods Sold | Expense |
| `5100` | Operating Expenses | Expense |
| `5200` | Salary Expense | Expense |
| `5300` | Rent Expense | Expense |

## Double-Entry Validation

Journal entries enforce:

```text
Total Debits = Total Credits
```

Unbalanced entries are rejected.

The accounting layer also validates that an active fiscal year exists before posting.

---

# Automatic Accounting Integration

Financial operations can automatically create accounting entries.

Examples:

```text
Invoice
  ↓
Accounts Receivable
  +
Sales Revenue
  +
Tax Payable
```

```text
Payment
  ↓
Cash / Bank
  +
Accounts Receivable
```

```text
Expense
  ↓
Operating Expense
  +
Cash
```

```text
Vendor Invoice
  ↓
Inventory / Tax
  +
Accounts Payable
```

This allows operational modules to feed the General Ledger without requiring every transaction to be manually entered.

---

# Trial Balance

The accounting module provides Trial Balance reporting.

Example response structure:

```json
{
  "accounts": [
    {
      "accountCode": "1000",
      "accountName": "Cash",
      "totalDebit": 50000,
      "totalCredit": 10000
    }
  ],
  "totals": {
    "debit": 100000,
    "credit": 100000,
    "isBalanced": true
  }
}
```

---

# Purchasing / Procure-to-Pay

Purchasing covers the procurement lifecycle.

```text
Vendor
   ↓
Purchase Order
   ↓
Approval
   ↓
Goods Receipt Note
   ↓
Inventory Update
   ↓
Vendor Invoice
   ↓
Matching
   ↓
Approval
   ↓
Accounting
```

Purchase orders support an approval-aware lifecycle:

```text
DRAFT
  ↓
ISSUED
  ↓
APPROVED
  ↓
PARTIALLY_RECEIVED
  ↓
RECEIVED
```

Vendor invoices can use matching logic before accounting integration.

---

# Approval Engine

The project includes a configurable multi-step approval engine.

An approval template can define ordered steps:

```text
Approval Template
      │
      ├── Step 1 → User / Role
      ├── Step 2 → User / Role
      └── Step 3 → User / Role
```

Supported operations include:

- Create approval templates.
- Submit entities for approval.
- View pending approvals.
- Approve.
- Reject.
- Cancel.
- View approval history.
- Emit completion/rejection events.

The engine is used by workflows such as:

- Payroll.
- Leave applications.
- Attendance adjustments.
- Purchase orders.
- Other configurable entity workflows.

---

# HRMS

The HRMS domain contains several interconnected modules.

## Employees

Supports:

- Employee master data.
- Departments.
- Designations.
- Employee hierarchy.
- Manager relationships.
- Employee documents.

Example hierarchy:

```text
CEO
 │
 ├── Engineering Manager
 │       ├── Developer
 │       └── Developer
 │
 └── Finance Manager
         ├── Accountant
         └── Accountant
```

---

# Attendance

Attendance functionality includes:

- Check-in.
- Check-out.
- Late detection.
- Shift-aware attendance.
- Attendance adjustments.
- Attendance period management.
- Payroll summaries.

Late detection uses the employee's assigned shift and configured grace period.

---

# Leave Management

Leave workflows include:

```text
Create Leave Application
        ↓
Submit for Approval
        ↓
Approval Engine
        ↓
Approved
        ↓
Deduct Leave Balance
        ↓
Update Attendance
```

On approval, the system updates the employee's leave balance and marks relevant attendance records as `ON_LEAVE`.

---

# Shifts & Holidays

Shift management supports:

- Shift definitions.
- Start/end times.
- Break durations.
- Late grace periods.
- Early-exit grace periods.
- Minimum work duration.
- Weekly offs.
- Night shifts.
- Employee shift assignments.

Holiday calendars can be managed independently.

---

# Payroll

Payroll supports:

- Salary components.
- Flat salary components.
- Percentage-based components.
- Employee salary structures.
- Effective dates.
- Payroll runs.
- Payslips.
- Payroll approval.
- Attendance integration.
- Accounting integration.

Example:

```text
Employee
   ↓
Salary Structure
   ↓
Attendance Summary
   ↓
Payroll Run
   ↓
Approval
   ↓
Processed
   ↓
Payslip
   ↓
Accounting Event
```

---

# Reporting

The reporting system provides:

### Dashboard

- Current-month sales.
- Previous-month comparison.
- Expense metrics.
- Inventory valuation.
- Tax metrics.
- Unpaid invoices.
- Profit estimate.
- Top customers.
- Historical trends.

### Sales Reports

- Total sales.
- Invoice count.
- Average invoice value.
- Top customers.
- Monthly sales.

### Expense Reports

- Total expenses.
- Expense categories.
- Monthly expenses.

### Inventory Reports

- Stock value.
- Low-stock products.
- Recent movements.

### Tax Reports

- Tax collected.
- Tax liability.

---

# Asynchronous Report Exports

Large exports are processed asynchronously rather than blocking an HTTP request.

```text
POST /reports/export
        ↓
Create BullMQ Job
        ↓
Return Job ID
        ↓
Worker
        ↓
Read Database in Batches
        ↓
Generate CSV
        ↓
Upload to Storage
        ↓
Generate Download URL
        ↓
Send Email
        ↓
Client Polls Job Status
```

Large datasets are processed using cursor-based batches to reduce memory pressure.

---

# Background Jobs

BullMQ is used for asynchronous processing.

Current queue workloads include:

- Email delivery.
- Invoice PDF generation.
- Report exports.
- Audit exports.
- Accounting jobs.
- Demo data seeding.
- Outbox relay processing.
- Storage cleanup.

The backend also includes queue monitoring and Bull Board integration.

---

# PDF Generation

Invoice PDFs can be generated using PDFKit.

Generated documents can contain:

- Organization information.
- Invoice number.
- Issue date.
- Due date.
- Customer details.
- Line items.
- Quantities.
- Prices.
- Discounts.
- Taxes.
- Totals.
- Notes.

PDF generation can happen asynchronously through BullMQ.

---

# Email System

Email functionality is built around Nodemailer and the queue system.

Email workflows include:

- Email verification.
- Password reset.
- Organization invitations.
- Invoice delivery.
- Report export notifications.
- Email-change verification.

Failures can be persisted for troubleshooting and auditing.

---

# Storage

The backend supports:

### Local Storage

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
```

### S3-Compatible Storage

```env
STORAGE_PROVIDER=s3

S3_REGION=...
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=...
```

This makes the storage layer suitable for local development as well as cloud/object-storage deployments.

---

# Audit Logging

Important business operations generate audit records.

Examples:

```text
ORGANIZATION_CREATED
ORGANIZATION_UPDATED

AUTH_LOGIN
AUTH_LOGOUT
AUTH_LOGOUT_ALL

INVOICE_CREATED
INVOICE_UPDATED
INVOICE_DELETED

PAYMENT_CREATED

EXPENSE_CREATED
EXPENSE_UPDATED
EXPENSE_DELETED

VENDOR_CREATED
VENDOR_UPDATED

SHIFT_CREATED
SHIFT_UPDATED
```

Audit entries can capture:

- Actor.
- Organization.
- Action.
- Entity type.
- Entity ID.
- Metadata.
- Timestamp.

This provides traceability for business operations.

---

# Idempotency

Critical write operations use idempotency protection.

This is particularly important for:

- Inventory changes.
- Invoice operations.
- Payment operations.

The goal is to prevent duplicate processing when clients retry requests because of:

- Network failures.
- Timeouts.
- Browser retries.
- Load balancer retries.
- Client-side retry logic.

---

# Observability

The backend includes a dedicated observability stack.

## Structured Logging

Uses:

- Pino.
- pino-http.
- Request IDs.
- Structured request/response metadata.

## Metrics

Prometheus-compatible metrics are exposed through:

```text
GET /metrics
```

## Distributed Tracing

OpenTelemetry is used for tracing.

The Docker development stack includes Grafana Tempo for trace collection.

## Monitoring Stack

```text
Application
    │
    ├── Pino ──────────────► Logs
    │
    ├── Prometheus ────────► Metrics
    │
    └── OpenTelemetry ────► Tempo
                              │
                              ▼
                           Grafana
```

---

# API Structure

All primary APIs use the versioned prefix:

```text
/api/v1
```

## Route Groups

| Prefix | Module |
|---|---|
| `/auth` | Authentication |
| `/organizations` | Organizations |
| `/roles` | Roles |
| `/permissions` | Permissions |
| `/invitations` | Invitations |
| `/customers` | Customers |
| `/vendors` | Vendors |
| `/products` | Products |
| `/inventory` | Inventory |
| `/godowns` | Warehouses |
| `/stock-groups` | Stock groups |
| `/grns` | Goods Receipt Notes |
| `/delivery-challans` | Delivery Challans |
| `/stock-journals` | Stock transfers |
| `/stock-verifications` | Stock verification |
| `/batches` | Batch tracking |
| `/serial-numbers` | Serial tracking |
| `/invoices` | Sales invoices |
| `/payments` | Payments |
| `/expenses` | Expenses |
| `/taxes` | Tax configuration |
| `/transactions` | Financial transactions |
| `/accounting` | Accounting |
| `/purchase-orders` | Purchase orders |
| `/vendor-invoices` | Vendor invoices |
| `/employees` | Employees |
| `/departments` | Departments |
| `/designations` | Designations |
| `/attendance` | Attendance |
| `/leaves` | Leave management |
| `/shifts` | Shift management |
| `/holidays` | Holiday calendar |
| `/payroll` | Payroll |
| `/approvals` | Approval workflows |
| `/reports` | Reporting |
| `/health` | Health checks |
| `/demo` | Demo functionality |

---

# Project Structure

```text
erp/
│
├── backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   ├── logger.ts
│   │   │   ├── mail.ts
│   │   │   └── redis.ts
│   │   │
│   │   ├── domains/
│   │   │   │
│   │   │   ├── iam/
│   │   │   │   ├── auth/
│   │   │   │   ├── organizations/
│   │   │   │   ├── roles/
│   │   │   │   ├── permissions/
│   │   │   │   └── invitations/
│   │   │   │
│   │   │   ├── contacts/
│   │   │   │   ├── customers/
│   │   │   │   └── vendors/
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── products/
│   │   │   │   ├── inventory/
│   │   │   │   ├── godowns/
│   │   │   │   ├── stock-groups/
│   │   │   │   ├── batches/
│   │   │   │   ├── serial-numbers/
│   │   │   │   ├── grn/
│   │   │   │   ├── delivery-challans/
│   │   │   │   ├── stock-journals/
│   │   │   │   └── stock-verifications/
│   │   │   │
│   │   │   ├── financials/
│   │   │   │   ├── invoices/
│   │   │   │   ├── payments/
│   │   │   │   ├── expenses/
│   │   │   │   ├── taxes/
│   │   │   │   ├── transactions/
│   │   │   │   ├── accounting/
│   │   │   │   └── purchasing/
│   │   │   │
│   │   │   ├── hrms/
│   │   │   │   ├── employees/
│   │   │   │   ├── attendance/
│   │   │   │   ├── leaves/
│   │   │   │   ├── shifts/
│   │   │   │   ├── holidays/
│   │   │   │   └── payroll/
│   │   │   │
│   │   │   └── core/
│   │   │       ├── approvals/
│   │   │       ├── reports/
│   │   │       ├── health/
│   │   │       └── demo/
│   │   │
│   │   ├── middleware/
│   │   ├── monitoring/
│   │   ├── queue/
│   │   ├── services/
│   │   ├── shared/
│   │   ├── lib/
│   │   └── utils/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── docs/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── app/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── providers/
│   │   └── lib/
│   │
│   ├── cypress/
│   ├── package.json
│   └── next.config.ts
│
├── docs/
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

# Frontend Areas

The Next.js frontend contains pages for:

- Authentication.
- Onboarding.
- Dashboard.
- Customers.
- Vendors.
- Products.
- Taxes.
- Invoices.
- Payments.
- Inventory.
- Warehouses.
- Batches.
- Serial numbers.
- Stock groups.
- GRNs.
- Delivery Challans.
- Stock journals.
- Stock verification.
- Purchases.
- Vendor invoices.
- Reports.
- Accounting.
- Approvals.
- Audit logs.
- Employees.
- Departments.
- Designations.
- Attendance.
- Leaves.
- Shifts.
- Holidays.
- Payroll.
- Payslips.
- Organization settings.
- Members.
- Roles.
- Profile.

---

# Getting Started

## Prerequisites

Recommended:

- Node.js 20+
- npm
- PostgreSQL 16+
- Redis 7+
- Docker
- Docker Compose

---

## 1. Clone the Repository

```bash
git clone https://github.com/hardik-agarwal18/erp.git

cd erp
```

---

# 2. Start Infrastructure

The easiest option is Docker Compose.

```bash
cd backend

docker compose up -d postgres redis
```

To start the complete local stack:

```bash
docker compose up -d
```

This can start:

- PostgreSQL.
- Redis.
- Prometheus.
- Grafana.
- Tempo.

---

# 3. Configure Backend Environment

Create:

```text
backend/.env
```

Example:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-secret
COOKIE_SECRET=replace-with-a-long-random-secret

EMAIL_VERIFY_SECRET=replace-with-a-long-random-secret
PASSWORD_RESET_SECRET=replace-with-a-long-random-secret

STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads

MAIL_ENABLED=false

QUEUE_ENABLED=true

RATE_LIMIT_ENABLED=true
```

The backend validates environment variables at startup using Zod.

If S3 storage is enabled, the corresponding S3 credentials/configuration must also be supplied.

If email is enabled, SMTP configuration must be supplied.

---

# 4. Install Backend Dependencies

```bash
cd backend

npm ci
```

---

# 5. Generate Prisma Client

```bash
npm run prisma:generate
```

---

# 6. Run Database Migrations

```bash
npm run prisma:migrate
```

---

# 7. Start Backend

Development:

```bash
npm run dev
```

The backend defaults to:

```text
http://localhost:5000
```

---

# 8. Start Frontend

Open another terminal:

```bash
cd frontend

npm ci
```

Set the frontend API URL if necessary:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The frontend defaults to:

```text
http://localhost:3000
```

---

# Docker Deployment

The backend includes a multi-stage production Dockerfile.

Build the application:

```bash
cd backend

docker compose up --build
```

The Docker stack can provide:

```text
Backend
PostgreSQL
Redis
Prometheus
Grafana
Tempo
```

---

# Testing

The project has extensive automated testing across backend and frontend.

## Backend Unit Tests

```bash
cd backend

npm run test:unit
```

## Backend Integration Tests

```bash
npm run test:integration
```

## Complete Backend Suite

```bash
npm test
```

## Coverage

```bash
npm run test:coverage
```

---

# Frontend Validation

## Lint

```bash
cd frontend

npm run lint
```

## Typecheck

```bash
npm run typecheck
```

## Production Build

```bash
npm run build
```

---

# Cypress E2E Tests

Interactive mode:

```bash
npm run cypress:open
```

Headless mode:

```bash
npm run cypress:run
```

The E2E suite covers areas such as:

- Authentication.
- Onboarding.
- Customers.
- Dashboard.
- Expenses.
- Inventory.
- Invoices.
- Payments.
- Products.
- Purchases.
- Reports.
- Settings.
- Transactions.
- Vendors.
- Audit logs.

---

# Load Testing

The backend includes Autocannon-based load-testing scripts.

General load test:

```bash
npm run test:load
```

Authentication scenario:

```bash
npm run test:load:auth
```

Other scenario-specific scripts are available for organization, customer and category workloads.

---

# CI Pipeline

GitHub Actions runs on pushes and pull requests.

The CI pipeline includes:

```text
                  ┌──────────────────┐
                  │ Backend Unit     │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │ Backend          │
                  │ Integration      │
                  └────────┬─────────┘
                           │
      ┌────────────────────┼─────────────────────┐
      │                    │                     │
      ▼                    ▼                     ▼
Frontend Lint       Frontend Typecheck    Frontend Build
      │                    │                     │
      └────────────────────┼─────────────────────┘
                           │
                           ▼
                    Security Audit
                           │
                           ▼
                     Cypress E2E
```

The pipeline includes:

- Backend unit tests.
- Backend integration tests.
- Frontend lint.
- Frontend typecheck.
- Frontend production build.
- Dependency security audit.
- Cypress E2E testing.
- Build artifact handling.
- Dependency caching.

---

# Backend NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend with hot reload |
| `npm run build` | Compile backend |
| `npm start` | Run production server |
| `npm test` | Run all backend tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:coverage` | Generate test coverage |
| `npm run test:ci` | CI-oriented test execution |
| `npm run test:load` | Run general load tests |
| `npm run test:load:auth` | Run authentication load test |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run Prisma development migrations |
| `npm run check:config` | Validate configuration |

---

# Important Design Decisions

## 1. Domain-Driven Backend

The backend is organized around bounded contexts rather than one monolithic service.

```text
IAM
Contacts
Inventory
Financials
HRMS
Core
```

Each domain generally follows:

```text
Routes
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
```

---

## 2. Transactional Business Operations

Operations involving multiple related entities use Prisma transactions.

Examples:

- Organization provisioning.
- Invoice creation.
- Invoice issuance.
- Payment recording.
- Inventory updates.
- Accounting posting.
- Leave approval.
- Payroll processing.

This reduces the risk of partially completed business operations.

---

## 3. Soft Deletes

Several business entities use soft-delete/archive semantics.

This helps preserve:

- Historical records.
- Auditability.
- Relationships.
- Reporting consistency.

---

## 4. Queue-Based Processing

Slow or retryable work is moved into BullMQ workers.

Examples:

```text
HTTP Request
    ↓
Create Job
    ↓
Return Job ID
    ↓
Worker
    ↓
Process
```

This prevents expensive tasks from unnecessarily blocking API requests.

---

## 5. Event-Driven Cross-Module Integration

Internal domain events connect modules.

For example:

```text
Approval Completed
       ↓
Purchase Order Approved
       ↓
GRN Received
       ↓
Inventory Updated
```

Another example:

```text
Leave Approval
      ↓
Leave Balance Updated
      ↓
Attendance Updated
```

---

## 6. Double-Entry Accounting

Financial operations are connected to the accounting subsystem rather than treated as isolated CRUD records.

The accounting layer enforces:

```text
Debit = Credit
```

and maintains a Chart of Accounts.

---

## 7. Idempotency

Critical financial and inventory operations are protected against duplicate requests.

This is particularly important in distributed systems where clients may retry requests.

---

# Current Scope & Architectural Limitations

The current architecture intentionally focuses on a shared-schema, organization-based SaaS model.

Some enterprise capabilities are not currently implemented natively:

- PostgreSQL Row-Level Security.
- Tenant database sharding/ejection.
- Multi-region data residency routing.
- Integrated SaaS usage billing/metering.
- Dedicated tenant compute isolation.
- Advanced tenant-specific custom-field engine.
- Native multi-region tenant deployment.

These are potential future extension points rather than hidden assumptions.

---

# Documentation

The repository contains detailed backend documentation under:

```text
backend/docs/
```

Documentation covers:

- Backend architecture.
- Application entry points.
- Environment configuration.
- Middleware.
- Database architecture.
- Authentication.
- Organizations.
- Customers.
- Vendors.
- Products.
- Inventory.
- Invoices.
- Finance.
- Reports.
- Accounting.
- Approvals.
- HRMS.
- Purchasing.
- GRNs.
- Delivery Challans.
- Stock Journals.
- Stock Verification.
- Batches.
- Serial Numbers.

The repository also contains workflow and architecture material under:

```text
docs/
```

including end-to-end business workflows and system-design questions.

---

# Example End-to-End Workflows

## Sales

```text
Customer
   ↓
Product
   ↓
Tax
   ↓
Invoice
   ↓
Inventory
   ↓
PDF
   ↓
Email
   ↓
Payment
   ↓
Accounting
   ↓
Reports
```

## Purchasing

```text
Vendor
   ↓
Purchase Order
   ↓
Approval
   ↓
GRN
   ↓
Inventory
   ↓
Vendor Invoice
   ↓
Matching
   ↓
Accounting
```

## Employee Onboarding

```text
Organization
      ↓
Department
      ↓
Designation
      ↓
Employee
      ↓
Shift Assignment
      ↓
Salary Structure
      ↓
Attendance
      ↓
Payroll
```

## Leave

```text
Leave Application
       ↓
Approval Engine
       ↓
Approved
       ↓
Leave Balance Deduction
       ↓
Attendance = ON_LEAVE
```

---

# Contributing

Contributions are welcome.

Recommended workflow:

```bash
git checkout -b feature/your-feature

# make changes

# run backend tests
cd backend
npm test

# frontend validation
cd ../frontend
npm run lint
npm run typecheck
npm run build
```

Then open a pull request with:

- A clear description.
- Relevant implementation details.
- Tests performed.
- Any migration/configuration requirements.

---

# License

No explicit open-source license is currently declared in this repository.

Unless a separate license is provided by the project owner, the source code should be treated as **all rights reserved**.

---

# Author

**Hardik Agarwal**

GitHub: [@hardik-agarwal18](https://github.com/hardik-agarwal18)

Repository:

https://github.com/hardik-agarwal18/erp
