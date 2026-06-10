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

## Architecture Pattern

The codebase follows a **layered architecture** with a strict separation of concerns:

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
│   ├── modules/                  # Feature modules (17 modules)
│   │   ├── auth/                 # Authentication & authorization
│   │   ├── customers/            # Customer management
│   │   ├── demo/                 # Demo/seed data
│   │   ├── expenses/             # Expense tracking
│   │   ├── health/               # Health check endpoint
│   │   ├── inventory/            # Inventory management
│   │   ├── invitations/          # Organization invitations
│   │   ├── invoices/             # Invoice management
│   │   ├── organizations/        # Multi-tenant organization management
│   │   ├── payments/             # Payment recording
│   │   ├── permissions/          # Permission listing
│   │   ├── products/             # Product & category management
│   │   ├── reports/              # Reports & dashboard metrics
│   │   ├── roles/                # RBAC role management
│   │   ├── taxes/                # Tax rate management
│   │   ├── transactions/         # Financial transaction ledger
│   │   └── vendors/              # Vendor management
│   ├── monitoring/               # Prometheus metrics, OpenTelemetry tracing
│   ├── queue/                    # BullMQ queues, workers, jobs
│   ├── services/                 # Shared services (audit logging)
│   ├── shared/                   # Constants (permissions, RBAC), shared utilities
│   ├── types/                    # Express type augmentations
│   └── utils/                    # ApiError, apiResponse, asyncHandler
├── prisma/                       # Prisma schema & migrations
├── scripts/                      # Config check, load testing
├── tests/                        # Unit & integration tests
├── Dockerfile                    # Production Docker image
├── docker-compose.yml            # Local development stack
└── package.json                  # Dependencies & scripts
```

## Key Design Decisions

1. **Multi-tenancy via `organizationId`** – All tenant-owned models are automatically scoped using Prisma extensions
2. **Soft deletes** – Customer, Product, Invoice, Payment, etc. use `deletedAt` instead of hard deletes
3. **RBAC** – Role-based access control with granular permissions (owner → admin → manager → member)
4. **Queue-first emails** – All emails go through BullMQ by default; direct dispatch as fallback
5. **Audit trail** – Every significant action is logged to the `AuditLog` table
6. **CSRF protection** – Double-submit cookie pattern for refresh token flows
7. **Token blacklisting** – Revoked access tokens are blacklisted in Redis

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
