# Documentation Audit & Ownership Baseline

## Context & Methodology
This audit evaluates the existing `d:\erp\docs\` directory against the active codebase (`backend/src`, `prisma/schema.prisma`).
**Rule Enforced**: Any documentation not strictly verified against the current codebase is marked **UNKNOWN** or **Unverifiable**.

---

## TASK 1 — DOCUMENTATION INVENTORY

### Architecture Documentation

**1. `docs/architecture/backend-architecture.md`**
* **Purpose**: Overview of the Express 5 + Prisma + Redis architecture.
* **Primary Audience**: Backend Engineers.
* **Last Known Relevance**: High.
* **Status**: Partially Current.
* **Coverage**: Folder structure, Runtime Flow, Layering, Module Boundaries.
* **Quality Score**: 8/10
* **Missing Information**: Lacks details on the BullMQ queue architecture, despite the code indicating its presence (`src/queue/board.ts`, `src/queue/worker.service.ts`).
* **Improvement Suggestions**: Needs immediate update to include Queue infrastructure, Prometheus monitoring (`src/monitoring/metrics.ts`), and the `tenant.middleware.ts` details.

**2. `docs/backend/api-reference.md`**
* **Purpose**: API endpoint specifications.
* **Primary Audience**: Fullstack Engineers.
* **Last Known Relevance**: High.
* **Status**: Partially Current.
* **Coverage**: Health, Auth, Organizations, Roles, Permissions, Core Business Modules (Customers, Vendors, Invoices, Payments, etc.).
* **Quality Score**: 8/10
* **Missing Information**: Missing API endpoints for Queue Observability (`/api/v1/queues` -> `src/queue/observability.ts`).
* **Improvement Suggestions**: Regenerate or update to include all admin/queue routes mapped in `app.ts`.

**3. `docs/architecture/authentication-flow.md`**
* **Purpose**: Details signup, login, refresh, and workspace switching.
* **Primary Audience**: Backend and Security Engineers.
* **Last Known Relevance**: High.
* **Status**: Current. Verified against `schema.prisma` (RefreshSession table) and `app.ts` (`/api/v1/auth` routes).
* **Coverage**: Token model, Flow Diagrams, CSRF usage.
* **Quality Score**: 9/10
* **Missing Information**: None detected based on initial code read.
* **Improvement Suggestions**: Keep as the canonical source.

*(Note: There are ~40 other files in `docs/` and `docs/audit/`, `docs/business/`, `docs/design/`, `docs/frontend/` that are currently marked **UNKNOWN** as they have not been verified line-by-line against the codebase. Many appear to be historical audits like `wave2-retrospective.md` and `frontend-redesign-final-report.md`.)*

---

## TASK 2 — DOCUMENTATION COVERAGE MATRIX

| Area | Existing Docs | Quality | Coverage | Missing |
| :--- | :--- | :--- | :--- | :--- |
| Authentication | `authentication-flow.md` | 9 | High | None |
| Authorization | `authorization-flow.md` | UNKNOWN | Unknown | Unknown |
| RBAC | `roles-permissions.md` | UNKNOWN | Unknown | Unknown |
| Organizations | `organizations.md` | UNKNOWN | Unknown | Unknown |
| Customers | `customers.md` | UNKNOWN | Unknown | Unknown |
| Vendors | `vendors.md` | UNKNOWN | Unknown | Unknown |
| Products | `api-reference.md` | 8 | Medium | Detailed Flow Diagrams |
| Inventory | `inventory.md` | UNKNOWN | Unknown | Unknown |
| Invoices | `invoices.md` | UNKNOWN | Unknown | Unknown |
| Payments | `api-reference.md` | 8 | Low | Dedicated Payment Flow Guide |
| Reports | `reports.md` | UNKNOWN | Unknown | Unknown |
| Monitoring | None Found | N/A | None | Complete Guide to Pino/Prometheus |
| Queue System | None Found | N/A | None | Complete Guide to BullMQ |
| Deployment | `deployment/` docs | UNKNOWN | Unknown | Unknown |
| Testing | `testing.md` | UNKNOWN | Unknown | Unknown |

---

## TASK 3 — DOCUMENTATION DE-DUPLICATION MATRIX

| Topic | Documents | Overlap % | Canonical Source | Action |
| :--- | :--- | :--- | :--- | :--- |
| API Specs | `api-reference.md`, `data-table-api.md` | UNKNOWN | `api-reference.md` | Merge & Rewrite |
| Database | `database-design.md`, `entities.md`, `prisma-schema.md` | High | `database-guide.md` (To be created) | Consolidate |
| Audits (Historical) | `*-audit.md`, `wave2-retrospective.md` | N/A | N/A | Archive |

*Goal: Establish one source of truth per topic in Phase 2.*

---

## TASK 4 — DOCUMENTATION ACCURACY AUDIT

* **`authentication-flow.md`**: **Accurate**. Verified: `RefreshSession` exists in `schema.prisma`. JWT and CSRF strategies mentioned align with Express configurations.
* **`backend-architecture.md`**: **Partially Accurate**. Mentions Prisma, Redis, Zod, Error Middleware. FAILS to document the BullMQ infrastructure (`src/queue/*`) and Prometheus integration (`src/monitoring/*`) which are clearly visible in `server.ts` and `app.ts`.
* **`api-reference.md`**: **Partially Accurate**. Covers most routes found in `app.ts`, but misses `/api/v1/admin/queues` and `/api/v1/health` (though Health is briefly mentioned, the dedicated module routes are not expanded).
* **Other Docs**: **Unverifiable** (Requires further deep-dive).

---

## TASK 5 — KNOWLEDGE GAP ANALYSIS

### Missing Documentation Report

| Topic | Priority | Reason |
| :--- | :--- | :--- |
| **Queue Lifecycle (BullMQ)** | Critical | `server.ts` initializes workers and schedulers, but no architecture doc explains the job flow, retries, or failure handling. |
| **Observability (Pino/Prometheus)** | Critical | `app.ts` uses `pino-http` and AsyncLocalStorage (`loggerContext`), but this is not documented for debugging. |
| **Tenant Isolation Middleware** | High | `app.ts` implies multi-tenancy, but the exact mechanism of `tenant.middleware.ts` is not centrally documented. |
| **Audit Logging** | Medium | `AuditLog` table exists, but no documentation explains how side-effects are captured. |
| **Deployment Recovery** | High | Missing standard operating procedures for production outages. |

---

## TASK 6 — MODULE OWNERSHIP PRIORITY

Based on the `schema.prisma` relations and `backend/src/modules/` directory structure:

| Module | Criticality | Complexity | Risk | Read Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Critical | High | High | 1 (Read Immediately) |
| **Organizations** | Critical | High | High (Tenant boundaries) | 1 (Read Immediately) |
| **Queue/Workers** | High | High | High (Asynchronous failures) | 1 (Read Immediately) |
| **Invoices** | High | Medium | Medium (Financial data) | 2 (Read Soon) |
| **Inventory** | High | Medium | Medium (Stock discrepancies) | 2 (Read Soon) |
| **Transactions** | High | Medium | Medium | 2 (Read Soon) |
| **Customers/Vendors** | Medium | Low | Low | 3 (Read Later) |
| **Reports** | Medium | Low | Low (Read-only) | 3 (Read Later) |

---

## TASK 7 — TOP 50 FILES (CRITICAL FILE MAP - PRELIMINARY)

*A full 50-file map will be generated in `03-critical-file-map.md`. The absolute core files are:*

1. **`backend/prisma/schema.prisma`**
   * **Purpose**: Single source of truth for database schema and relations.
   * **Importance**: Critical. Changes here cascade everywhere.
   * **Risk Level**: Extreme.
2. **`backend/src/app.ts`**
   * **Purpose**: Express application setup, global middleware, and routing.
   * **Importance**: Critical. Defines the HTTP pipeline.
3. **`backend/src/server.ts`**
   * **Purpose**: Application entry point. Bootstraps Redis, Prisma, SMTP, Workers, and HTTP.
   * **Importance**: Critical. Controls startup and graceful shutdown sequences.
4. **`backend/src/config/env.ts`**
   * **Purpose**: Zod validation for runtime environment variables.
   * **Importance**: High. Missing config will crash the app.
5. **`backend/src/queue/worker.service.ts`**
   * **Purpose**: Initializes BullMQ workers for background jobs.
   * **Importance**: High. Defines asynchronous system capabilities.

---

## TASK 8 — SYSTEM UNDERSTANDING SCORE

| Area | Understanding Score | Weakness |
| :--- | :--- | :--- |
| Backend | 40/100 | Good grasp of routes/schema, but deep service logic is unread. |
| Frontend | 10/100 | UNKNOWN. Need to map `frontend/src/features` vs API. |
| Database | 70/100 | Read `schema.prisma`, fully understand relations. |
| Security | 40/100 | Auth flow understood, but RBAC/tenant-isolation needs verification. |
| Queue System | 10/100 | Know it exists (BullMQ), but zero knowledge of job definitions. |
| Monitoring | 20/100 | Know Pino/Prometheus exist, but don't know the metrics tracked. |
| Documentation | 30/100 | Assessed root docs, but 80% of `docs/` remains UNKNOWN. |

---

## TASK 9 — FINAL RECOMMENDATIONS

1. **Documentation Cleanup**: Archive all historical `*-audit.md`, `*-proposal.md`, and `*-report.md` files from previous development phases into a `docs/archive/` folder to reduce noise.
2. **Documentation Consolidation**: Merge `database-design.md`, `entities.md`, `prisma-schema.md`, and `relationships.md` into a single canonical `docs/database/database-guide.md`.
3. **Knowledge Gap Filling**: Immediately prioritize drafting `docs/observability/observability-guide.md` and `docs/queues/queue-guide.md`.
4. **Codebase Understanding**: Proceed to Phase 2 (System Overview) using strict code-reading of `server.ts`, `app.ts`, `tenant.middleware.ts`, and the BullMQ setup to eliminate the UNKNOWN gaps identified above.
