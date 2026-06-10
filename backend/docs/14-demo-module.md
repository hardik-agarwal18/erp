# Demo Module

**Location:** `src/modules/demo/`

Provides tools for quickly populating a workspace with realistic demo data. Useful for staging, sales presentations, or local development onboarding. Generates thousands of rows of interconnected records instantly.

---

## Files

| File | Purpose |
|---|---|
| `demo.service.ts` | Orchestrates the creation of users, workspaces, and triggers data seeding |
| `demo.controller.ts` | HTTP request/response handling |
| `demo.routes.ts` | Express route definitions |
| `demo.repository.ts` | Uses Faker to generate and batch-insert realistic records across all entity types |

---

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/demo/seed` | ❌ Public | Generates a new user account with populated workspaces and returns credentials |

---

## Service Functions (`demo.service.ts`)

### `demoService.seedDemoEnvironment()`
Generates a complete multi-tenant environment from scratch.
1. Generates a random email (e.g., `demo-abc12@example.com`) and hashes a default password (`password123`).
2. Creates the primary user account (`User`).
3. Uses `organizationService` to create two distinct workspaces (`Organization`).
4. Creates 3 additional users and assigns them different roles (`admin`, `manager`, `member`) within the first workspace to demonstrate RBAC.
5. Calls `demoRepository.seedWorkspaceData` for both workspaces to populate entities.
6. Returns the generated login credentials (`email`, `password`, `organization`) so the client can automatically authenticate upon success.

---

## Repository Functions (`demo.repository.ts`)

### `seedWorkspaceData(organizationId, organizationName, userId)`
Uses `@faker-js/faker` and massive `prisma.createMany` batches to populate:
1. **Taxes**: Standard rates (e.g., standard, reduced).
2. **Categories**: Products grouped into logical categories.
3. **Products & Inventory**: Generates physical and service products. Randomizes stock quantities.
4. **Customers & Vendors**: Creates dozens of B2B and B2C profiles.
5. **Invoices**: Generates historical and current invoices spanning the last 6 months. Mixes statuses (`DRAFT`, `ISSUED`, `PAID`).
6. **Payments**: Records payments against invoices.
7. **Expenses**: Scatters operational expenses across various categories (Software, Office, Travel).
8. **Transactions**: Automatically builds the General Ledger matching the invoices and expenses.

**Note:** Deliberately bypasses standard Services to allow bulk inserting massive amounts of relational data quickly via `createMany`, circumventing performance overhead and strict audit constraints.

---

## Controller Functions (`demo.controller.ts`)

| Function | Key Behavior |
|---|---|
| `seedDemo` | Calls `seedDemoEnvironment()`. Returns 201 Created with `{ email, password, organization }` so frontend can immediately dispatch a login request. Traps errors and returns 500 cleanly to avoid hanging on massive failures. |
