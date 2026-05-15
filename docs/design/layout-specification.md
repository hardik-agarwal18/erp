# Layout Wireframe Specification

## App Shell

- **Desktop Layout (>1440px)**: Fluid full-bleed layout. Sidebar fixed on the left. Top Navbar fixed on the top spanning the remaining width.
- **Laptop Layout (1024px - 1439px)**: Identical to desktop, but horizontal paddings reduce from 40px to 24px.
- **Tablet Layout (768px - 1023px)**: Sidebar hidden by default. Triggered via hamburger menu (opens as a drawer).
- **Mobile Layout (<768px)**: Stacked layout. Bottom navigation bar replaces the sidebar for core routes, with a "More" drawer.

---

## Sidebar

- **Collapsed Width**: `64px` (Icons only).
- **Expanded Width**: `240px` (Icons + Labels + Chevrons).
- **Navigation Hierarchy**: Flat primary links with a maximum of 1 level of collapsible nesting.
- **Search Behavior**: A prominent "Search" button sits at the top of the sidebar, invoking the Command Palette (`Cmd/Ctrl + K`).
- **Active States**: Bold text, solid subtle background (`bg-neutral-100` / `bg-neutral-800`), active indicator bar on the left edge (2px wide).
- **Hover States**: Subtle background change (`bg-neutral-50` / `bg-neutral-900`).
- **Keyboard Navigation**: Standard Tab indexing. Arrow keys when focused inside the menu.

---

## Top Navbar

- **Height**: `56px` (Strictly enforced to maximize vertical content space).
- **Search Placement**: If the sidebar is collapsed or hidden, search icon appears in the Top Navbar.
- **Breadcrumbs**: Located on the left side, aligned with the content edge. Updates dynamically based on nested routes.
- **Actions**: Global contextual actions (e.g., "Create +") sit on the right.
- **Notifications**: Bell icon on the right with an absolute positioned red dot indicator. Opens a dropdown popover.
- **Profile Menu**: Avatar on the far right. Opens a dropdown containing Settings, Theme Toggle, and Logout.

---

## Content Area

- **Max Width Strategy**: The main content area `div` does not have a hard `max-w`. Instead, it is `w-full` with fluid padding. However, text-heavy pages (like Settings or Single Profile Views) should constrain their inner container to `max-w-5xl` for readability.
- **Padding Strategy**: `px-10 py-8` (Desktop), `px-6 py-6` (Tablet), `px-4 py-4` (Mobile).
- **Grid Strategy**: Use standard Tailwind Grid (`grid-cols-12`). Dashboards span 4, 8, or 12 columns.
- **Table Strategy**: Tables take 100% width of their container. They are wrapped in a generic Card component with 0 padding (`p-0`) and utilize sticky headers to handle vertical overflow gracefully.
