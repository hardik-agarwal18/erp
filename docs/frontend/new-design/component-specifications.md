# Component Specifications Blueprint

This document defines the strict requirements for all UI components in the ERP frontend, built on React, TypeScript, Tailwind CSS, Radix UI, and shadcn/ui.

---

## 1. Layout Components

### Sidebar
1. **Purpose**: Primary global navigation.
2. **Variants**: Fixed (Desktop), Collapsible (Laptop), Drawer (Tablet), Slide-over (Mobile).
3. **States**: Expanded, Collapsed, Active Item, Hover Item.
4. **Accessibility Requirements**: `role="navigation"`, `aria-label="Main Navigation"`, `aria-current="page"` on active items.
5. **Responsive Behavior**: Transitions width on breakpoints. Hides completely on mobile.
6. **Keyboard Support**: `Tab` through links.
7. **Animation Rules**: 200ms `ease-in-out` for width transition.
8. **Styling Rules**: Dark background (`bg-slate-950`), light text.
9. **Usage Examples**: Wrapping the main `AppShell`.
10. **Do's and Don'ts**: **Do** group related links. **Don't** add complex interactions inside the sidebar.

### Top Navbar
1. **Purpose**: Secondary navigation, global search, and user profile access.
2. **Variants**: Sticky top, Static top.
3. **States**: Default, Scrolled (adds bottom border/shadow).
4. **Accessibility Requirements**: `role="banner"`.
5. **Responsive Behavior**: Hamburger menu appears on mobile.
6. **Keyboard Support**: Support `Cmd/Ctrl + K` to open search.
7. **Animation Rules**: Instant.
8. **Styling Rules**: `bg-white/70 backdrop-blur-md`, 1px bottom border.
9. **Usage Examples**: Inside the main content wrapper.
10. **Do's and Don'ts**: **Do** keep it slim (max 64px height). **Don't** overload with actions.

*(Page Header and Content Wrapper follow similar structural patterns: clean padding, sticky behaviors where appropriate, and `<header>` / `<main>` semantic tags.)*

---

## 2. Data Components

### Data Table
1. **Purpose**: Displaying tabular data (Invoices, Customers, Products).
2. **Variants**: Default, Dense (compact padding), Expandable Rows.
3. **States**: Loading (Skeleton), Empty, Sorted Asc/Desc, Row Selected.
4. **Accessibility Requirements**: `role="table"`, `aria-sort` on headers, `caption` for table description.
5. **Responsive Behavior**: Horizontal scroll on smaller screens; sticky left/right columns if needed.
6. **Keyboard Support**: Arrow keys to navigate cells (if editable), Space to select row.
7. **Animation Rules**: No animations on sort to ensure fast perceived performance.
8. **Styling Rules**: Alternating row colors (optional), subtle hover backgrounds (`hover:bg-slate-50`).
9. **Usage Examples**: Customer List, Purchase Orders.
10. **Do's and Don'ts**: **Do** use pagination for >50 rows. **Don't** use text-wrapping in tight columns (use ellipsis and tooltips).

### Charts / KPIs
1. **Purpose**: Visual representation of metrics.
2. **Variants**: Line, Bar, Doughnut, Sparkline.
3. **States**: Loading, Empty Data, Hover (Tooltip).
4. **Accessibility Requirements**: SR-only summary text explaining the chart's trend.
5. **Responsive Behavior**: Fluid width (100%), height maintains aspect ratio.
6. **Keyboard Support**: Focusable data points for tooltips.
7. **Animation Rules**: 300ms initial draw animation. No animation on resize.
8. **Styling Rules**: Use semantic variables (`--chart-1`, `--success`, etc.).
9. **Usage Examples**: Revenue Dashboard.
10. **Do's and Don'ts**: **Do** provide absolute numbers on hover. **Don't** rely solely on color to convey bad/good trends.

---

## 3. Form Components

### Input / Textarea
1. **Purpose**: Text data entry.
2. **Variants**: Default, With Icon, With Prefix/Suffix.
3. **States**: Default, Hover, Focus (`ring-2`), Disabled, Error (Red outline), Success.
4. **Accessibility Requirements**: Must have associated `<label>` or `aria-label`. `aria-invalid` on error.
5. **Responsive Behavior**: Full width on mobile.
6. **Keyboard Support**: Standard input behavior. `Enter` to submit form.
7. **Animation Rules**: Fast transition on focus ring.
8. **Styling Rules**: 6px border radius, 1px border.
9. **Usage Examples**: Name field, Description box.
10. **Do's and Don'ts**: **Do** show validation errors inline below the input. **Don't** use placeholder text as a replacement for labels.

### Select / Date Picker
1. **Purpose**: Selection from a predefined list or calendar.
2. **Variants**: Single Select, Multi-select, Searchable Select (Combobox).
3. **States**: Closed, Open, Selected, Error.
4. **Accessibility Requirements**: Radix UI `Select` handles ARIA. `aria-expanded`, `role="listbox"`.
5. **Responsive Behavior**: Opens as a bottom-sheet on mobile (Native select on iOS).
6. **Keyboard Support**: Up/Down to navigate options, `Enter` to select, `Escape` to close.
7. **Animation Rules**: 150ms fade-in/slide-up.
8. **Styling Rules**: Matches Input styling. Dropdown has `shadow-lg`.
9. **Usage Examples**: Vendor Selection, Invoice Due Date.
10. **Do's and Don'ts**: **Do** use Combobox for lists > 15 items. **Don't** nest selects inside other scrolling containers without boundary checks.

---

## 4. Feedback Components

### Alert / Toast
1. **Purpose**: System feedback to the user.
2. **Variants**: Success, Error, Warning, Info.
3. **States**: Visible, Dismissing.
4. **Accessibility Requirements**: `role="alert"` or `role="status"`, `aria-live="polite"`.
5. **Responsive Behavior**: Toasts stack bottom-right on desktop, top-center on mobile.
6. **Keyboard Support**: `Escape` to dismiss latest toast.
7. **Animation Rules**: Slide in from edge, slide out.
8. **Styling Rules**: High contrast backgrounds for Alerts. Soft backgrounds with semantic borders for Toasts.
9. **Usage Examples**: "Invoice Saved", "Payment Failed".
10. **Do's and Don'ts**: **Do** keep text under 60 characters. **Don't** require user interaction to dismiss non-critical info.

### Modal / Dialog
1. **Purpose**: Blocking overlay for focused tasks.
2. **Variants**: Standard, Alert Dialog (Destructive), Full-screen Drawer.
3. **States**: Open, Closed, Submitting (Buttons loading).
4. **Accessibility Requirements**: Focus trapped inside, `aria-modal="true"`.
5. **Responsive Behavior**: Centers on desktop, anchors to bottom on mobile.
6. **Keyboard Support**: `Escape` to close (unless critical). First input auto-focused.
7. **Animation Rules**: 200ms backdrop fade, modal scale-up.
8. **Styling Rules**: `shadow-xl`, `rounded-xl` (14px). Dimmed backdrop (`bg-black/50`).
9. **Usage Examples**: "Confirm Deletion", "Quick Add Customer".
10. **Do's and Don'ts**: **Do** put primary action bottom-right. **Don't** stack modals on top of other modals.

---

## 5. Navigation Components

### Breadcrumb / Tabs
1. **Purpose**: Contextual location and local view switching.
2. **Variants**: Simple text (Breadcrumb), Underlined/Pilled (Tabs).
3. **States**: Active, Inactive, Hover.
4. **Accessibility Requirements**: `role="tablist"`, `aria-current` for breadcrumbs.
5. **Responsive Behavior**: Horizontal scroll on tabs for mobile.
6. **Keyboard Support**: Left/Right arrows to switch tabs.
7. **Animation Rules**: Animated underline or background sliding between active tabs.
8. **Styling Rules**: Subtle colors, bold active state.
9. **Usage Examples**: Customer Profile Tabs (Details | Invoices | Notes).
10. **Do's and Don'ts**: **Do** sync tabs with URL search params. **Don't** use tabs for sequential workflows (use wizards).

### Pagination
1. **Purpose**: Navigating large datasets.
2. **Variants**: Standard (Numbers), Simple (Previous/Next).
3. **States**: Disabled (on ends), Active page.
4. **Accessibility Requirements**: `aria-label="Pagination Navigation"`.
5. **Responsive Behavior**: Collapse middle numbers into ellipses on mobile.
6. **Keyboard Support**: Tab to buttons.
7. **Animation Rules**: None.
8. **Styling Rules**: Ghost buttons for inactive, primary for active.
9. **Usage Examples**: Audit Logs bottom bar.
10. **Do's and Don'ts**: **Do** show total items count.

---

## 6. Utility Components

### Card
1. **Purpose**: Grouping related information.
2. **Variants**: Default, Interactive (Hoverable).
3. **States**: Default, Hover (if interactive).
4. **Accessibility Requirements**: If interactive, use a wrapping `<a>` or `<button>`.
5. **Responsive Behavior**: Full width on mobile.
6. **Keyboard Support**: None natively, relies on internal elements.
7. **Animation Rules**: Subtle shadow/transform on hover if interactive.
8. **Styling Rules**: `bg-white`, `border-slate-200`, `rounded-xl`, `shadow-sm`.
9. **Usage Examples**: Dashboard Widgets, Settings sections.
10. **Do's and Don'ts**: **Do** use consistent padding (`p-6` desktop, `p-4` mobile).

### Badge / Avatar
1. **Purpose**: Status indicators and user identification.
2. **Variants**: Semantic Statuses (Success, Error), Circular/Square.
3. **States**: Default.
4. **Accessibility Requirements**: Avatar must have `alt` text. Badge must be legible.
5. **Responsive Behavior**: Static size.
6. **Keyboard Support**: None.
7. **Animation Rules**: None.
8. **Styling Rules**: Badge text `uppercase tracking-wider text-xs`. Avatar standard sizes (32px, 40px).
9. **Usage Examples**: "Paid" badge on invoice, Profile menu trigger.
10. **Do's and Don'ts**: **Do** use initials for Avatar fallback. **Don't** use badges as clickable buttons without clear affordance.
