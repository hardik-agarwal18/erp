# Design Token Audit

## Tailwind Configuration (`tailwind.config.ts`)
- Uses CSS variables (`hsl(var(--color))`) for mapping colors.
- Custom colors defined: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `success`, `warning`, `chart-*`.
- **Border Radius**: Maps to a global `--radius` variable. Extends `lg`, `md`, `sm` relative to this variable.
- **Shadows**: Defines a custom `panel` shadow.
- **Background Images**: Defines a `dashboard-grid` pattern.

## CSS Variables (`src/app/globals.css`)
- **Spacing**: Does not redefine Tailwind's default spacing scale, meaning developers can use arbitrary spacing (e.g., `p-5`, `p-7`).
- **Typography**: Imports `tnum` and `cv05` features but does not strictly enforce `Inter` at the global CSS root level (likely relies on Next.js `next/font`).
- **Colors**: Defined in HSL format. The default palette leans towards generic Radix/shadcn defaults (Blue/Slate).

## Refactor Opportunities
- Enforce the 4px spacing scale directly in `tailwind.config.ts` if needed, or document it strictly.
- Overhaul the HSL values to match the new Enterprise SaaS palette (higher contrast, more distinct states).
- Expand the shadow system to support elevation levels (sm, md, lg, xl).
