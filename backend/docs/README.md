# Documentation Index

Complete reference for the Precision Ledger ERP backend. All docs are in `backend/docs/`.

---

## Core Architecture

| File | Topic |
|---|---|
| [00-overview.md](./00-overview.md) | Tech stack, architecture pattern, directory structure, domain breakdown, route prefix map |
| [01-entry-and-config.md](./01-entry-and-config.md) | `app.ts`, `server.ts`, `config/` (env, logger, database, mail, Redis) |
| [02-middleware.md](./02-middleware.md) | Auth, tenant context, validation, rate limiting, sanitization, idempotency, cache, metrics auth |
| [03-database.md](./03-database.md) | Prisma client, extensions (multi-tenancy, soft-delete), base repository, transactions |
| [04-libraries-and-utilities.md](./04-libraries-and-utilities.md) | JWT, bcrypt, cookies, storage, ApiError, apiResponse, asyncHandler, queue, monitoring |

---

## IAM (Identity & Access Management)

| File | Topic |
|---|---|
| [05-auth-module.md](./05-auth-module.md) | Login, register, refresh token, logout, CSRF, token blacklisting |
| [06-organizations-module.md](./06-organizations-module.md) | Multi-tenant orgs, member management, provisioning |

> **Also in IAM:** Roles (`/api/v1/roles`), Permissions (`/api/v1/permissions`), Invitations (`/api/v1/invitations`) — see `src/domains/iam/`

---

## Contacts

| File | Topic |
|---|---|
| [07-customers-module.md](./07-customers-module.md) | Customer CRUD, ledger view |
| [15-vendors-module.md](./15-vendors-module.md) | Vendor CRUD, purchase ledger, soft-delete |

---

## Inventory

| File | Topic |
|---|---|
| [08-products-module.md](./08-products-module.md) | Product & category CRUD, physical vs service, batch/serial flags |
| [09-inventory-module.md](./09-inventory-module.md) | Core stock items, manual adjustments, transfers, movement logs |
| [16-godowns-module.md](./16-godowns-module.md) | Warehouse/storage location management |
| [17-grn-module.md](./17-grn-module.md) | Goods Receipt Notes – inbound stock with batch/serial/weighted avg cost |
| [18-delivery-challans-module.md](./18-delivery-challans-module.md) | Delivery Challans – outbound dispatch with serial status update |
| [19-stock-journals-module.md](./19-stock-journals-module.md) | Inter-godown stock transfers (bi-directional movements) |
| [20-stock-verifications-module.md](./20-stock-verifications-module.md) | Physical stock count & automatic variance reconciliation |
| [21-batches-serials-stockgroups.md](./21-batches-serials-stockgroups.md) | Batch tracking, serial number lifecycle, stock groups |

---

## Financials

| File | Topic |
|---|---|
| [10-invoices-module.md](./10-invoices-module.md) | Sales invoice creation, line items, tax application, PDF generation |
| [11-purchases-module.md](./11-purchases-module.md) | _(Legacy)_ — see [29-purchasing-module.md](./29-purchasing-module.md) |
| [12-finance-module.md](./12-finance-module.md) | Transactions (GL read-only), Payments, Taxes, Expenses |
| [22-accounting-module.md](./22-accounting-module.md) | Double-entry accounting, Chart of Accounts, journal entries, trial balance |
| [29-purchasing-module.md](./29-purchasing-module.md) | Purchase Orders (with approval), Vendor Invoices (with 3-way match) |

---

## HRMS (Human Resource Management)

| File | Topic |
|---|---|
| [24-hrms-employees-module.md](./24-hrms-employees-module.md) | Employee CRUD, departments, designations, hierarchy, documents, timeline |
| [25-hrms-attendance-module.md](./25-hrms-attendance-module.md) | Check-in/out, late detection, status reclassification, adjustments, period locking |
| [26-hrms-leaves-module.md](./26-hrms-leaves-module.md) | Leave types, balances, application workflow, attendance integration |
| [27-hrms-shifts-holidays-module.md](./27-hrms-shifts-holidays-module.md) | Shift definitions, effective-date assignments, holiday calendar |
| [28-hrms-payroll-module.md](./28-hrms-payroll-module.md) | Salary components, structure assignment, payroll run generation, pro-ration, approval |

---

## Core Platform

| File | Topic |
|---|---|
| [13-reports-module.md](./13-reports-module.md) | Dashboard metrics, financial reports |
| [14-demo-module.md](./14-demo-module.md) | Demo data seeding |
| [23-approvals-module.md](./23-approvals-module.md) | Multi-step approval workflow engine, EventBus integration |

---

## Cross-Cutting Architecture Patterns

### Multi-Tenancy
Every API request must include either an `x-organization-id` header or a token claim. `tenantContextMiddleware` resolves org membership, permissions (cached in Redis), and populates `req.organization`, `req.member`, `req.permissions`.

### Event-Driven Module Communication
Modules communicate via in-process `EventBus` (`src/shared/events/event-bus.ts`). Key event chains:

```
GRN.receive()         → grn.completed        → PO status update (PARTIALLY_RECEIVED/RECEIVED)
Payroll.submit()      → approval.completed   → APPROVED + payroll.processed
Leaves.submit()       → approval.completed   → balance deducted + attendance ON_LEAVE
Attendance.adjust()   → approval.completed   → adjustment applied
VendorInvoice.post()  → vendor-invoice.posted
Invoice.create()      → (direct) accounting journal posted
```

### Approval Engine Entity Types

| `entityType` | Submitted By | On Approval |
|---|---|---|
| `PURCHASE_ORDER` | Purchase Orders module | PO → `APPROVED` |
| `PAYROLL_RUN` | Payroll module | Run → `APPROVED` + payroll.processed |
| `LEAVE_APPLICATION` | Leaves module | Balance deducted + attendance updated |
| `ATTENDANCE_ADJUSTMENT` | Attendance module | Adjustment applied to record |
| `PROCUREMENT_OVERRIDE` | Vendor Invoices module | Invoice posted with override |

### Audit Trail Pattern
Every significant action calls `auditService.record({ organizationId, userId, entityType, entityId, action, metadata? })`. Records stored in `AuditLog` table, queryable per entity via employee timeline or admin audit reports.

### Idempotency
Critical write endpoints use `Idempotency-Key` header. Duplicate requests within TTL window return cached response without re-processing.
