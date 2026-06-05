# Route Inventory

## All Application Routes
- `/` (Home)
- `/audit-logs`
- `/customers` (includes `/create`, `/[id]`, `/[id]/edit`)
- `/dashboard`
- `/expenses` (includes `/create`, `/[id]`)
- `/forgot-password`, `/reset-password`, `/login`, `/signup`, `/verify-email` (Auth)
- `/inventory` (includes `/adjustments`, `/audit`, `/transfers`, `/warehouses`)
- `/invoices` (includes `/create`, `/[id]`, `/[id]/edit`)
- `/onboarding`
- `/payments` (includes `/[id]`)
- `/products` (includes `/create`, `/[id]`, `/[id]/edit`)
- `/purchases` (includes `/create`, `/goods-received-notes`, `/[id]`)
- `/reports`
- `/settings` (includes `/members`, `/organization`, `/roles`)
- `/transactions` (includes `/list`, `/reconciliation`, `/[id]`)
- `/vendors` (includes `/create`, `/[id]`, `/[id]/edit`)

## Route Hierarchy
The application uses a relatively flat Next.js App Router hierarchy. Most modules are top-level routes.

## Protected Routes
All routes except Auth routes (`/login`, `/signup`, etc.) are protected via the `useWorkspace` hook in the `AppShell`.

## Layout Usage
A single top-level layout (`src/app/layout.tsx`) acts as the primary provider. The `AppShell` component wraps all protected routes.

## Data-Heavy Pages
- `/transactions`
- `/inventory/adjustments`
- `/audit-logs`

## Form-Heavy Pages
- `/invoices/create`
- `/purchases/create`
- `/customers/[id]/edit`
