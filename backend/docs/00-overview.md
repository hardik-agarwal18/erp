# Backend Overview

## Technology Stack

| Technology | Purpose | Version |
|---|---|---|
| **Express 5** | HTTP framework | `^5.2.1` |
| **TypeScript 6** | Language | `^6.0.3` |
| **Prisma 6** | ORM / Database | `^6.19.3` |
| **Redis** | Caching / Sessions / Queues | `^5.8.3` |
| **BullMQ** | Background job processing | `^5.78.0` |
| **Nodemailer** | Email delivery | `^7.0.6` |
| **Zod 4** | Schema validation | `^4.4.3` |
| **Pino** | Structured logging | `^9.9.5` |
| **PDFKit** | PDF generation | `^0.18.0` |
| **OpenTelemetry** | Distributed tracing | `^0.218.0` |
| **Prometheus (prom-client)** | Metrics collection | `^15.1.3` |
| **AWS SDK (S3)** | Cloud storage | `^3.1062.0` |
| **date-fns** | Date manipulation | `^4.x` |

## Architecture Pattern

The codebase follows a **layered domain-driven architecture** with a strict separation of concerns:

```
Routes → Controller → Service → Repository → Database (Prisma)
```

Each module (e.g., `auth`, `customers`, `invoices`) contains:
- **`*.routes.ts`** – Express route definitions with middleware chains
- **`*.controller.ts`** – HTTP request/response handling
- **`*.service.ts`** – Business logic layer
- **`*.repository.ts`** – Data access layer (Prisma queries)
- **`*.types.ts`** – TypeScript interfaces for the module
- **`*.validators.ts`** – Zod schemas for request validation
- **`*.middleware.ts`** – Module-specific middleware (optional)
- **`index.ts`** – Barrel exports

## Directory Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app setup (middleware, routes)
│   ├── server.ts                 # Server bootstrap (connect Redis, SMTP, start workers)
│   ├── config/                   # Environment, database, logger, mail, Redis config
│   ├── database/                 # Prisma client, extensions, base repository, seed, transactions
│   ├── lib/                      # Low-level utilities (bcrypt, JWT, cookies, storage)
│   ├── mail/                     # Email service, templates, providers
│   ├── middleware/               # Global Express middleware
│   ├── monitoring/               # Prometheus metrics, OpenTelemetry tracing
│   ├── queue/                    # BullMQ queues, workers, jobs
│   ├── services/                 # Shared services (audit logging)
│   ├── shared/                   # Constants (permissions, RBAC), events, enums, cache
│   ├── types/                    # Express type augmentations
│   ├── utils/                    # ApiError, apiResponse, asyncHandler
│   └── domains/                  # Feature modules grouped by bounded context
│       ├── iam/                  # Identity & Access Management
│       │   ├── auth/             # Authentication & token lifecycle
│       │   ├── organizations/    # Multi-tenant organization management
│       │   ├── roles/            # RBAC role management
│       │   ├── permissions/      # Permission listing
│       │   └── invitations/      # Organization member invitations
│       ├── contacts/             # External party management
│       │   ├── customers/        # Customer management
│       │   └── vendors/          # Vendor / supplier management
│       ├── inventory/            # Physical stock management
│       │   ├── products/         # Product & category management
│       │   ├── inventory/        # Stock items & movements (core)
│       │   ├── godowns/          # Warehouse / storage location management
│       │   ├── stock-groups/     # Product groupings for reporting
│       │   ├── batches/          # Batch / lot tracking for perishables
│       │   ├── serial-numbers/   # Individual unit serial number tracking
│       │   ├── grn/              # Goods Receipt Notes (inbound stock)
│       │   ├── delivery-challans/# Delivery Challans (outbound dispatch)
│       │   ├── stock-journals/   # Inter-godown stock transfers
│       │   └── stock-verifications/ # Physical stock count / audit
│       ├── financials/           # Financial & accounting
│       │   ├── invoices/         # Sales invoice management
│       │   ├── payments/         # Payment recording & invoice reconciliation
│       │   ├── expenses/         # Expense tracking
│       │   ├── taxes/            # Tax rate management
│       │   ├── transactions/     # General ledger read-only view
│       │   ├── accounting/       # Chart of accounts, journal entries, trial balance
│       │   └── purchasing/       # Purchase orders & vendor invoices
│       ├── hrms/                 # Human Resource Management System
│       │   ├── employees/        # Employee profiles, departments, designations
│       │   ├── attendance/       # Check-in/out, adjustments, period management
│       │   ├── leaves/           # Leave types, balances, applications
│       │   ├── shifts/           # Shift definitions & employee assignments
│       │   ├── holidays/         # Holiday calendar management
│       │   └── payroll/          # Salary components, structures, payroll runs
│       └── core/                 # Cross-cutting concerns
│           ├── approvals/        # Multi-step approval workflow engine
│           ├── reports/          # Reports & dashboard metrics
│           ├── health/           # Health check endpoint
│           └── demo/             # Demo / seed data
├── prisma/                       # Prisma schema & migrations
├── scripts/                      # Config check, load testing
├── tests/                        # Unit & integration tests
├── Dockerfile                    # Production Docker image
├── docker-compose.yml            # Local development stack
└── package.json                  # Dependencies & scripts
```

## Domain Breakdown

| Domain | Bounded Context | Key Modules |
|---|---|---|
| **IAM** | Identity & Access | Auth, Organizations, Roles, Permissions, Invitations |
| **Contacts** | External Parties | Customers, Vendors |
| **Inventory** | Stock Management | Products, Inventory, Godowns, Stock Groups, Batches, Serials, GRN, Challans, Journals, Verifications |
| **Financials** | Money & Accounting | Invoices, Payments, Expenses, Taxes, Transactions, Accounting, Purchasing |
| **HRMS** | Human Resources | Employees, Attendance, Leaves, Shifts, Holidays, Payroll |
| **Core** | Platform Services | Approvals, Reports, Health, Demo |

## Key Design Decisions

1. **Multi-tenancy via `organizationId`** – All tenant-owned models are automatically scoped using Prisma extensions. Every API call enforces org isolation via `tenantContextMiddleware`.
2. **Soft deletes** – Customer, Product, Invoice, Payment, Employee, etc. use `deletedAt` instead of hard deletes, preserving audit history.
3. **RBAC** – Role-based access control with granular permissions (owner → admin → manager → member). Permissions are cached in Redis per member session.
4. **Queue-first emails** – All emails go through BullMQ by default; direct dispatch as fallback.
5. **Audit trail** – Every significant action (create/update/delete) is logged to the `AuditLog` table via `auditService.record()`.
6. **CSRF protection** – Double-submit cookie pattern for refresh token flows.
7. **Token blacklisting** – Revoked access tokens are blacklisted in Redis using the `jti` claim.
8. **Approval Workflow Engine** – Multi-step approvals (payroll runs, leave applications, attendance adjustments) use a configurable engine in `core/approvals` emitting domain events via an in-process EventBus.
9. **Double-entry Accounting** – The accounting module enforces balanced journal entries (Debits = Credits) and links all financial operations (invoices, payments, expenses, payroll) to a Chart of Accounts.
10. **Idempotency** – Critical write endpoints (inventory, invoices, payments) use an idempotency middleware to prevent duplicate processing.
11. **Weighted Average Costing** – GRN receipts compute a running weighted average cost per inventory item per godown.

## API Route Prefix Map

All routes are served under `/api/v1/`. Summary:

| Prefix | Module |
|---|---|
| `/auth` | IAM – Authentication |
| `/organizations` | IAM – Organizations |
| `/roles` | IAM – Roles |
| `/permissions` | IAM – Permissions |
| `/invitations` | IAM – Invitations |
| `/customers` | Contacts – Customers |
| `/vendors` | Contacts – Vendors |
| `/products` | Inventory – Products |
| `/inventory` | Inventory – Stock Items & Movements |
| `/godowns` | Inventory – Godowns |
| `/stock-groups` | Inventory – Stock Groups |
| `/grns` | Inventory – GRN |
| `/delivery-challans` | Inventory – Delivery Challans |
| `/stock-journals` | Inventory – Stock Journals |
| `/stock-verifications` | Inventory – Stock Verifications |
| `/batches` | Inventory – Batch Management |
| `/serial-numbers` | Inventory – Serial Numbers |
| `/invoices` | Financials – Sales Invoices |
| `/payments` | Financials – Payments |
| `/expenses` | Financials – Expenses |
| `/taxes` | Financials – Tax Rates |
| `/transactions` | Financials – General Ledger (read-only) |
| `/accounting` | Financials – Chart of Accounts & Trial Balance |
| `/purchase-orders` | Financials – Purchase Orders |
| `/vendor-invoices` | Financials – Vendor Invoices |
| `/employees` | HRMS – Employees |
| `/departments` | HRMS – Departments |
| `/designations` | HRMS – Designations |
| `/attendance` | HRMS – Attendance |
| `/leaves` | HRMS – Leave Management |
| `/shifts` | HRMS – Shift Management |
| `/holidays` | HRMS – Holiday Calendar |
| `/payroll` | HRMS – Payroll |
| `/approvals` | Core – Approval Engine |
| `/reports` | Core – Reports & Dashboard |
| `/health` | Core – Health Check |
| `/demo` | Core – Demo Seeding |
| `/metrics` | Prometheus (raw scrape endpoint) |
| `/api/v1/admin/queues` | BullBoard (queue admin UI) |
| `/api/v1/queues` | Queue observability API |
| `/api/v1/storage` | Static file serving (uploads) |

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Tests with coverage report |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run check:config` | Validate environment configuration |
