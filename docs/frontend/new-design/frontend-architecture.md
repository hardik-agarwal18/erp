# Frontend Architecture Specification

This document defines the architectural standards for the ERP frontend built with React, TypeScript, Next.js, Tailwind CSS, React Query, React Hook Form, Zod, and shadcn/ui.

---

## > [!CAUTION]
## DO NOT MODIFY
The following layers of the application are strictly protected and **must not be altered** during UI/UX redesign efforts:
- **Business Logic**: Any calculations, data transformations, or domain rules.
- **API Contracts**: Request/Response schemas, endpoint paths, or methods.
- **Authentication Flows**: Login, token handling, session management.
- **Authorization Logic**: Role-based access control (RBAC), permission checks.
- **Backend Integration Logic**: How queries and mutations interface with external services.

**Only the following areas are permitted for modification:**
- UI (User Interface components)
- UX (Workflows, Navigation)
- Components (shadcn/ui, custom UI elements)
- Styling (Tailwind classes, CSS variables)
- Layouts (Grid, Flexbox, Containers)
- Accessibility (ARIA, focus management)

---

## 1. Folder Structure
The project uses a standard Next.js `app` router structure paired with a feature-driven `src` directory.
```text
src/
├── app/               # Next.js App Router (Pages, Layouts, API routes)
├── components/        # Global shared UI components
│   ├── ui/            # Base primitives (shadcn/ui)
│   └── layout/        # Shell, Sidebar, Navbar
├── features/          # Feature-based modules (Dashboard, Sales, Purchases, etc.)
├── hooks/             # Global custom hooks
├── lib/               # Utility functions and configurations
├── providers/         # Global context providers (React Query, Auth)
├── schemas/           # Global Zod schemas
├── services/          # API layer and network calls
├── store/             # Global state (Zustand/Context)
└── types/             # Global TypeScript definitions
```

## 2. Feature-Based Architecture
To maintain scalability, code is organized by feature rather than type. Each feature directory (e.g., `src/features/sales/`) should contain its own:
- `components/`: Feature-specific UI.
- `hooks/`: Feature-specific logic or React Query hooks.
- `api/`: API calls specific to the feature.
- `types.ts`: Feature-specific interfaces.
- `index.ts`: Public API for the feature module.

## 3. Component Organization
- **Smart Components**: Handle data fetching and state (placed in `features/[name]/components/`).
- **Dumb Components**: Pure presentation, taking props and emitting events (placed in `components/ui/` or feature directories if highly specific).

## 4. Layout Architecture
- `layout.tsx` wraps pages.
- `AppShell` acts as the primary layout containing the `Sidebar`, `TopNavbar`, and a `ContentWrapper` `<main>` area.

## 5. State Management Strategy
- **Server State**: Managed exclusively by **React Query**.
- **Form State**: Managed exclusively by **React Hook Form**.
- **Local UI State**: Managed via `useState` or `useReducer`.
- **Global UI State**: Managed via Zustand or React Context (e.g., Theme, Sidebar collapsed state). Avoid putting business data in global state.

## 6. API Integration Strategy
- Use a dedicated `api` client (Axios or Fetch wrapper in `src/lib/api.ts`).
- Never make raw fetch calls inside components. Always wrap them in a service function.

## 7. React Query Standards
- Separate hooks into their own files (e.g., `useCustomers.ts`).
- Always define query keys systematically (e.g., `['customers', 'list', filters]`).
- Use `staleTime` appropriately to reduce unnecessary refetches (e.g., 5 minutes for static data).

## 8. Form Architecture
- Built on **React Hook Form**.
- Always use the `<Form>` wrapper to provide context.
- Keep forms controlled via standard components rather than native inputs where complex UI is required.

## 9. Validation Architecture
- Built on **Zod**.
- Define schemas in `schemas/` (global) or alongside the feature.
- Use `@hookform/resolvers/zod` to connect Zod schemas to React Hook Form for synchronous inline validation.

## 10. Error Handling Architecture
- **API Errors**: Caught by React Query and surfaced via Toasts.
- **Form Errors**: Caught by Zod and surfaced inline beneath inputs.
- **Crash Errors**: Caught by Next.js `error.tsx` boundary components.

## 11. Authentication Architecture *(Do Not Modify)*
- Session tokens are handled via HTTP-only cookies or secure context.
- Unauthenticated users are redirected by middleware or layout wrapper components.

## 12. Authorization Architecture *(Do Not Modify)*
- Utilize the `useWorkspace` / RBAC hooks to check permissions.
- Hide UI elements entirely if the user lacks access (rather than showing disabled buttons).

## 13. Accessibility Architecture
- Radix UI handles primitive accessibility (ARIA, focus traps).
- Ensure color contrast ratios meet WCAG AA standards.
- Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`).

## 14. Performance Optimization Strategy
- Memoize expensive calculations with `useMemo`.
- Avoid prop drilling to prevent unnecessary re-renders.
- Use standard React performance tools.

## 15. Lazy Loading Strategy
- Use `next/dynamic` or `React.lazy` for heavy components not visible above the fold (e.g., massive charts, complex rich-text editors).

## 16. Code Splitting Strategy
- Handled natively by Next.js App Router based on route segments.
- Keep shared dependencies in `lib/` or `components/ui/` to optimize chunks.

## 17. Responsive Strategy
- Desktop First: Design for 1440px, then use Tailwind's `max-w-*` and breakpoints (`xl`, `lg`, `md`, `sm`) to step down.

## 18. Testing Strategy
- Unit tests for complex utility functions.
- Cypress for critical end-to-end paths (Login, Checkout, Creating Invoices).

## 19. Naming Conventions
- **Files/Folders**: `kebab-case` (e.g., `purchase-list-view.tsx`).
- **Components**: `PascalCase` (e.g., `PurchaseListView`).
- **Functions/Variables**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE`.

## 20. Coding Standards
- Strictly enforce TypeScript typing (no `any`).
- Enforce ESLint rules.
- Prefer functional components and hooks over class components.

## 21. Reusability Guidelines
- If a component is used in more than 2 features, move it to `src/components/shared/` or `src/components/ui/`.
- Build components to be highly customizable via `className` overriding (using `cn` / `tailwind-merge`).

## 22. Scalability Guidelines
- Never mutate props or state directly.
- Avoid massive single files (>400 lines). Break down into sub-components.

## 23. Maintainability Guidelines
- Document complex logic blocks with JSDoc comments.
- Keep components focused on a single responsibility.

## 24. AI-Agent Development Rules
- **Rule 1**: Read `design-system.md` and `component-specifications.md` before generating UI.
- **Rule 2**: Strictly adhere to the **DO NOT MODIFY** boundary rules. Do not rewrite backend integration logic.
- **Rule 3**: Use the established Tailwind configuration for spacing and colors. Do not invent arbitrary hex codes or spacing values.
- **Rule 4**: Ensure all new files map strictly to the established `kebab-case` folder structure.
