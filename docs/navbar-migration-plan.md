# Navbar Migration Plan

## 1. Current Navbar Structure
The current `TopNavbar` component utilizes a multi-row flex layout.
- The top row contains the `WorkspaceSwitcher` and `SearchBar` clustered to the left, and `Quick Create`, `NotificationCenter`, and `ProfileMenu` clustered to the right.
- The bottom row contains the `Breadcrumb` component.
- The padding is `py-3`, leading to a variable height that consumes significant vertical real estate, pushing core content down.

## 2. Breadcrumb System
Currently stacked underneath the main search/switcher row. Moving it into a single horizontal row will require moving the `WorkspaceSwitcher` to the right-hand side, or collapsing the `SearchBar` width.

## 3. Workspace Switcher
Currently placed in the primary focal point (top-left). In modern single-row ERP layouts, workspace selection is typically grouped with the user profile on the far right.

## 4. Global Search
The `SearchBar` currently triggers the `CommandPalette`. It visually spans a `max-w-xl` block. In a single-row layout, this can be centered to balance the breadcrumbs (left) and the user actions (right).

## 5. Command Palette Integration
The `CommandPalette` natively supports both `Ctrl+K` and `Cmd+K` via `(event.ctrlKey || event.metaKey)`. It is directly opened when the user interacts with the `SearchBar`.

## 6. Notifications & User Menu
Standard Radix UI implementations that sit on the far right. They consume minimal horizontal space and will remain untouched structurally.

---

## Proposed Implementation

1. **Flattening to Single-Row (`h-14`)**
   - We will replace the stacked `flex-col` / `space-y-3` layout in `top-navbar.tsx` with a single `h-14` flex row: `flex h-14 items-center justify-between px-5`.
   - The vertical padding `py-3` will be removed in favor of exact flex centering (`items-center`).

2. **Left Column: Navigation**
   - The `Breadcrumb` component will be shifted to the far-left, acting as the immediate context indicator adjacent to the Sidebar.

3. **Center Column: Search**
   - The `SearchBar` will sit in the center, visually unifying the "Search and Command" experience. It already opens the palette; we'll refine its styling to fit the `h-14` header.

4. **Right Column: Workspace & Actions**
   - The `WorkspaceSwitcher` will be relocated to the right-hand cluster, immediately preceding the `NotificationCenter` and `ProfileMenu`.
   - The "Quick Create" button will be removed or condensed into the palette if space demands it, but keeping it as a small button is fine.

5. **Behavior Preservation**
   - No underlying logic for `CommandPalette`, `Search`, or `Authentication` will be rewritten.
