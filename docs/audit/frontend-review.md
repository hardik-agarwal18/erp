# Frontend Review
**Audit Phase 7 — Frontend Architecture, State, API Layer, Contract Drift**
*Generated: 2026-06-17 | Auditor: Frontend Architect Review*

---

## Executive Summary

The frontend is a Next.js 15 application using the App Router with Tailwind CSS and shadcn/ui. The presence of both `src/schemas/` (frontend-specific) and `packages/shared-validation/` (monorepo shared) indicates Zod schema duplication. The frontend maintains its own `src/api/`, `src/services/`, and `src/store/` directories suggesting a layered architecture. Cypress is present for E2E testing. Full file-level inspection of frontend source was limited; findings below are evidence-backed where possible and clearly marked as INFERRED where not.

---

## 1. Architecture Overview

### Technology Stack
```
Framework: Next.js 15 (App Router)
Styling:   Tailwind CSS + shadcn/ui (Radix UI primitives)
Testing:   Cypress (E2E)
Build:     Vercel (vercel.json present)
Type:      TypeScript strict
```

**Evidence — package.json confirms:**
```json
{
  "dependencies": {
    "next": "...",
    "tailwindcss": "...",
    "@radix-ui/*": "..."
  }
}
```

### Directory Structure Analysis

| Directory | Purpose | Assessment |
|---|---|---|
| `src/app/` | Next.js App Router pages | Standard |
| `src/api/` | API client functions | Good separation |
| `src/components/` | Shared UI components | Standard |
| `src/features/` | Feature-sliced components | Good DDD alignment |
| `src/hooks/` | Custom React hooks | Good pattern |
| `src/providers/` | React Context providers | Standard |
| `src/schemas/` | Zod schemas | **Duplication risk** |
| `src/services/` | Business logic services | Layer overlap risk |
| `src/store/` | State management | INFERRED: Zustand or Redux |
| `src/types/` | TypeScript types | Expected |
| `src/constants/` | App constants | Expected |
| `src/lib/` | Utility functions | Expected |

---

## 2. API Contract Layer

### Finding 1: Dual Schema Definition (Contract Drift Risk)

**Evidence:**
```
packages/shared-validation/   ← Monorepo shared Zod schemas
frontend/src/schemas/         ← Frontend-local Zod schemas
```

**Impact:** Two independently maintained Zod schema sets for the same API. When the backend API changes (e.g., adding a new required field to invoice creation), the frontend's local schemas may not be updated — causing form validation to pass but API calls to fail.

**Recommendation:**
1. Identify which endpoints have schemas in both locations
2. Migrate all frontend schemas to consume `@erp/shared-validation` exclusively
3. Remove `src/schemas/` or limit it to purely frontend-specific UI schemas (not API shapes)

### Finding 2: No Auto-Generated API Client (OpenAPI)

**Evidence:**
- `backend/openapi.json` exists (1,446 bytes — appears to be a small skeleton)
- No evidence of `openapi-typescript`, `swagger-codegen`, or `@hey-api/openapi-ts` in frontend `package.json`

**Assessment:** The API client layer (`src/api/`) appears to be manually written fetch wrappers — not generated from the OpenAPI spec. Manual wrappers drift from the actual API as endpoints evolve.

**Recommendation:**
1. Expand `openapi.json` to be a complete spec (either manually maintained or generated from Zod via `@asteasolutions/zod-to-openapi` — already installed in backend)
2. Generate the frontend client from the OpenAPI spec on every backend build
3. This eliminates an entire class of client/server contract drift bugs

---

## 3. State Management

### Finding 3: State Management Architecture — INFERRED
The `src/store/` directory exists. Given the Next.js 15 App Router context:

**INFERRED:** Likely Zustand (lightweight, App Router compatible) or React Query / TanStack Query for server state.

**Key questions to verify:**
- Is server state (API data) managed separately from client UI state?
- Are financial data mutations handled optimistically or pessimistically?
- Is there cache invalidation on successful mutations?

**Recommendation:** If not already using TanStack Query, adopt it for server state. The combination of `useQuery` for reads and `useMutation` for writes with automatic cache invalidation is the industry standard for Next.js App Router applications.

---

## 4. Form Architecture

### Finding 4: Form Architecture — INFERRED
The presence of `src/schemas/` (Zod) strongly suggests React Hook Form + Zod integration (`zodResolver`).

**Concern:** If forms validate against frontend-local Zod schemas that differ from backend validation, forms may accept invalid data that the API rejects — poor UX.

**Recommendation:** Ensure all form schemas are sourced from `@erp/shared-validation`.

---

## 5. Cypress Testing Coverage

**Evidence:**
```
frontend/cypress/
frontend/cypress.config.ts
```

**INFERRED:** E2E tests exist. Coverage extent is unknown without inspecting test files.

**Recommendation:** Verify Cypress tests cover the critical financial workflows:
- Invoice creation and posting
- Payment recording
- Payroll run execution
- User invitation and role assignment

---

## 6. Key Frontend Risks

### 🟠 HIGH: Shared Validation Not Fully Adopted
**Finding:** `src/schemas/` duplicates validation logic from `packages/shared-validation/`.  
**Impact:** Contract drift between frontend validation and backend validation. Backend API changes do not automatically break frontend compilation — silent failures possible.

### 🟠 HIGH: No Generated API Client
**Finding:** Manual API fetch wrappers in `src/api/`.  
**Impact:** Method signatures, payload shapes, and response types can silently diverge from the backend. No compile-time verification that API calls match server expectations.

### 🟡 MEDIUM: Service Layer Responsibility Split
**Finding:** Both `src/api/` and `src/services/` directories exist.  
**Impact:** Unclear which layer handles business logic. Developers may add logic to either layer, creating inconsistency.  
**Recommendation:** Define clear boundaries: `src/api/` for raw HTTP calls, `src/services/` for business logic transformations, hooks/store for state management.

### 🟡 MEDIUM: `any` Usage in Frontend
**INFERRED:** Given the backend has widespread `any` usage (100+ files), the frontend likely has similar patterns.  
**Recommendation:** Enable `"strict": true` and `"noImplicitAny": true` in `tsconfig.json` and enforce via CI.

### 🟢 LOW: Vercel Deployment Configuration
**Evidence — `frontend/vercel.json` (125 bytes):**  
INFERRED: Standard Vercel configuration. CORS and API routing should be validated in the production Vercel deployment.

---

## 7. Component Architecture Assessment

### shadcn/ui Component Library
**Evidence:** `frontend/components.json` confirms shadcn/ui setup.  
**Assessment:** shadcn/ui is a solid choice — Radix UI primitives with Tailwind styling, fully owned by the project. No proprietary component library lock-in. Accessibility (ARIA) is built into Radix primitives.

### Feature-Slice Architecture
**Evidence:** `src/features/` directory exists alongside `src/components/`.  
**Assessment:** The intent to organize by feature is good (Feature-Sliced Design pattern). However, if both `src/components/` and `src/features/` contain components, clear boundaries need to be documented.

---

## 8. Performance (Frontend)

### Finding 5: No Observed Code-Splitting Strategy
**INFERRED:** With Next.js App Router, route-level code splitting is automatic. Component-level splitting with `React.lazy()` is **UNVERIFIED**.

### Finding 6: Financial Report Pages May Load Large Datasets
**Impact:** Trial balance, P&L, and balance sheet pages likely fetch full datasets without pagination. For organizations with many accounts and transactions, these pages could be slow.

**Recommendation:** Implement virtual scrolling for large data tables. Use streaming with `Suspense` boundaries for heavy report pages.

---

## 9. Summary

| Category | Status | Risk |
|---|---|---|
| Framework | Next.js 15 App Router | LOW — modern choice |
| Styling | Tailwind + shadcn/ui | LOW — industry standard |
| Schema duplication | Frontend + shared both | HIGH — drift risk |
| API client | Manual (no codegen) | HIGH — drift risk |
| State management | INFERRED/UNVERIFIED | MEDIUM |
| Testing | Cypress present | MEDIUM — coverage unknown |
| TypeScript strictness | UNVERIFIED | MEDIUM |
| Component organization | Feature + shared split | LOW — typical pattern |
