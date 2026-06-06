# AppShell Redesign Proposal

This proposal outlines the strategy to transition the current constrained layout into a fluid, enterprise-grade application shell tailored for data-dense ERP operations.

## Sidebar

**Structure & Dimensions**
- **Expanded Width**: 260px (Slightly tightened from 280px to return horizontal space to the content).
- **Collapsed Width**: 72px (Reduced from 88px to minimize footprint while keeping icons accessible).
- **Persistence**: Sidebar state must be persisted via local storage or cookies.

**Navigation Hierarchy**
- Remove deeply nested accordions where possible.
- **Favorites**: Introduce a dynamic top-level section where users can pin frequent pages (e.g., `Invoices`, `Stock Transfers`).
- **Recent Pages**: A dynamically updating list of the last 5 visited entities.
- **Search Integration**: A small `Cmd+K` hint baked directly into the top of the sidebar.

## Navbar

**Consolidated Layout**
- Flatten the currently stacked TopNavbar into a single, sleek `h-14` (56px) horizontal strip.
- **Global Search**: Center-aligned search bar that acts entirely as a trigger for the Command Palette.
- **Breadcrumbs**: Move breadcrumbs to the far-left of the Navbar (replacing the current Switcher location).
- **Workspace Switcher**: Move the switcher to the right-hand side, grouped with Notifications and the User Menu.
- **User Menu & Notifications**: Retain current Radix UI implementations, but tighten padding.

## Content Area

**Full-Width Strategy**
- Eliminate the `max-w-[1440px]` constraint from `app-shell.tsx`.
- The root `<main>` content wrapper will be `w-full flex-1 min-w-0`.
- **Data-Heavy Layouts**: Table-driven pages (like `TransactionLedger` or `Inventory`) will consume 100% of available width to maximize column visibility.
- **Ultra-Wide Monitor Behavior**: On monitors exceeding 1080p, tables will stretch fluidly. Forms and settings pages will manually opt-in to `max-w-4xl` or `max-w-5xl` to prevent unreadable horizontal spans.

## Page Header

**Refined Structure**
The Page Header must sit immediately below the Navbar and act as the distinct controller for the page data.

- **Title**: Dynamic, reading from page context.
- **Description**: Concise helper text.
- **Primary Action**: A distinctly styled solid button (e.g., `Create Invoice`, `Add Member`).
- **Secondary Actions**: An array of outline or ghost buttons (e.g., `Export to CSV`, `Filter`, `Settings`) placed adjacent to the primary action.
- **Slot Integration**: Expose a generic `children` or `footer` slot underneath the title to accommodate contextual Tabs (e.g., `Overview | History | Settings`).
