# Component Inventory

## Base UI Components (`src/components/ui/`)
- **Button**: Used 50+ times. Core action trigger. High refactor priority to support micro-animations and unified variants.
- **Card**: Used 50+ times. Main content wrapper. High refactor priority for standardizing padding and shadows.
- **Input / Textarea**: Heavy usage in forms. Needs focus ring consistency.
- **Table**: Critical for data density. Needs sticky headers and compact modes.
- **Select**: Used in forms.
- **Avatar, Badge, Label**: Utility components.

## Layout Components (`src/components/layout/`)
- **AppShell**: Primary wrapper. High priority for layout redesign.
- **Sidebar / TopNavbar**: Navigation. High priority.
- **CommandPalette**: Search implementation.
- **NotificationCenter, WorkspaceSwitcher**: Secondary navigation tools.

## Feature Components (`src/features/*/components/`)
There are over 80 feature-specific components spanning 12 domains.
- Examples: `invoice-editor.tsx`, `customer-profile.tsx`, `stock-adjustments-view.tsx`.
- **Dependencies**: These rely heavily on `components/ui/*`.
- **Refactor Priority**: Medium. We must refactor base UI components first, then update these feature components iteratively.
