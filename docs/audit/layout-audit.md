# Layout Audit

## AppShell
- The `AppShell` (`src/components/layout/app-shell.tsx`) establishes a `min-h-screen` container with a custom radial/linear gradient background and a `max-w-[1440px]` bounded central area with a shadow.
- This creates a "boxed" layout rather than a full-bleed SaaS layout.

## Sidebar
- Currently `w-[280px]` expanded and `w-[88px]` collapsed.
- Uses `lucide-react` icons.
- Has a complex nested hierarchy for Accounting and Inventory.

## Navbar (TopNavbar)
- Sits alongside the content area (not above the sidebar).
- Contains Breadcrumbs, Command Palette trigger, Workspace Switcher, and Notification Center.

## Layout Hierarchy
```
<body>
  <Providers>
    <AppShell>
      <Sidebar />
      <div className="flex-1">
        <TopNavbar />
        <main>{children}</main>
      </div>
    </AppShell>
  </Providers>
</body>
```

## Refactor Opportunities
- Move from a boxed `max-w-[1440px]` layout to a fluid full-bleed layout for better data density.
- Refine the Sidebar collapsing mechanism and visual hierarchy (it currently uses a dark `bg-slate-950` theme which contrasts heavily with the light content area).
