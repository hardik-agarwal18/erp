# Risk Assessment

## High-Risk Components
1. **`Button` and `Card`**: These are used in virtually every file (>50 usages each). Modifying their core paddings or base structure will cascade across the entire app.
2. **`Table`**: Data tables are the core of ERP. Altering table cell padding might break specific hardcoded widths in financial modules.
3. **`AppShell` / `Sidebar`**: The layout wrappers maintain the core state of the app (e.g., collapsed state). Breaking this breaks global navigation.

## Migration Strategy
1. **Tokens First**: Update `globals.css` and `tailwind.config.ts`. Because the application uses CSS variables (e.g., `bg-primary`), changing the underlying HSL values will safely propagate new colors instantly without touching component files.
2. **Layout Shell Second**: Redesign `AppShell` and `Sidebar`. This only touches `src/components/layout/` and immediately upgrades the "feel" of the app.
3. **Base Primitives Third**: Refactor `Button`, `Input`, `Card` one by one, visually checking them in a complex form (e.g., Invoice Create).
4. **Iterative Feature Rollout**: Once the foundation is solid, go feature-by-feature (e.g., Dashboard -> Sales -> Inventory) to apply dense tables and advanced UX patterns, ensuring business logic remains untouched.
