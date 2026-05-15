# ERP Design System Specification

## 1. Design Principles

**Productivity First, Aesthetics Second**
The application is a daily-use tool (6-10 hours/day). Every design decision must prioritize task completion speed, readability, and reduced cognitive load over flashy visual effects.

**High Information Density**
Users deal with complex data (inventory, accounting, logs). We optimize for showing more data per screen without feeling cluttered by utilizing precise padding, minimal borders, and strict typography.

**Predictable Consistency**
Similar actions should look and behave exactly the same across the application. A primary button always means the main action. A destructive button always means danger.

**Desktop-First Architecture**
The primary environment is a desktop/laptop monitor. Layouts, tables, and workflows are optimized for large screens, mouse precision, and keyboard navigation. Mobile is supported but secondary.

**Accessible by Default**
High contrast ratios, keyboard navigability, and clear focus states are non-negotiable.

---

## 2. Color System

We use a high-contrast, professional palette optimized for long viewing sessions to reduce eye strain.

### Neutral Scale
* **Neutral 0**: `#FFFFFF` (Light Bg)
* **Neutral 50**: `#FAFAFA` (Light App Bg)
* **Neutral 100**: `#F4F4F5` (Light Hover)
* **Neutral 200**: `#E4E4E7` (Light Borders)
* **Neutral 300**: `#D4D4D8` (Disabled Elements)
* **Neutral 400**: `#A1A1AA` (Placeholder Text)
* **Neutral 500**: `#71717A` (Secondary Text)
* **Neutral 600**: `#52525B` (Icon Default)
* **Neutral 700**: `#3F3F46` (Dark App Bg)
* **Neutral 800**: `#27272A` (Dark Hover / Borders)
* **Neutral 900**: `#18181B` (Primary Text / Dark Bg)
* **Neutral 950**: `#09090B` (Deep Dark Bg)

### Primary Palette (Brand/Action)
* **Primary 500**: `#000000` (Light Mode Primary) / `#FFFFFF` (Dark Mode Primary)
* **Primary Focus**: `#3B82F6` (Blue 500 - Focus Rings)

### Semantic Colors
* **Success**: `#10B981` (Green 500) | Bg: `#ECFDF5`
* **Warning**: `#F59E0B` (Amber 500) | Bg: `#FFFBEB`
* **Error**: `#EF4444` (Red 500) | Bg: `#FEF2F2`
* **Info**: `#3B82F6` (Blue 500) | Bg: `#EFF6FF`

### Theme Mapping
**Light Theme:**
* Background: Neutral 50
* Card: Neutral 0
* Text: Neutral 900
* Secondary Text: Neutral 500
* Border: Neutral 200

**Dark Theme:**
* Background: Neutral 950
* Card: Neutral 900
* Text: Neutral 50
* Secondary Text: Neutral 400
* Border: Neutral 800

> [!IMPORTANT]
> **WCAG Compliance**: All text and icons must maintain a minimum contrast ratio of 4.5:1 against their backgrounds.

---

## 3. Typography

**Font Family**: `Inter`, fallback to system fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).

### Hierarchy

| Type | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px | 40px | 600 (Semibold) | -0.02em | Marketing/Empty States |
| **H1** | 24px | 32px | 600 (Semibold) | -0.01em | Page Titles |
| **H2** | 20px | 28px | 600 (Semibold) | -0.01em | Section Titles |
| **H3** | 16px | 24px | 500 (Medium) | 0 | Card Headers |
| **H4** | 14px | 20px | 500 (Medium) | 0 | Small Headers / Table Headers |
| **Body Large** | 16px | 24px | 400 (Regular) | 0 | Long form reading |
| **Body Default** | 14px | 20px | 400 (Regular) | 0 | Standard UI / Tables |
| **Small** | 12px | 16px | 400 (Regular) | 0 | Meta data / Tooltips |
| **Caption** | 11px | 16px | 500 (Medium) | 0.05em | Uppercase Section Labels |

---

## 4. Spacing System

Based strictly on an 4px baseline grid. Never use arbitrary values.

* **2px** (`0.5`) - Internal borders, focus rings
* **4px** (`1`) - Tight grouping (icon + text)
* **8px** (`2`) - Standard component padding (buttons, inputs)
* **12px** (`3`) - Relaxed component padding
* **16px** (`4`) - Standard spacing between elements / Card padding
* **20px** (`5`) - Medium spacing
* **24px** (`6`) - Large Card padding / Section spacing
* **32px** (`8`) - Layout spacing
* **40px** (`10`) - Major layout spacing
* **48px** (`12`) - Page header margin
* **64px** (`16`) - Major section breaks

---

## 5. Grid System

* **Desktop (1440px+)**: 12 columns, 24px gutter. App shell utilizes a fixed sidebar (240px-280px) and a fluid content area constrained to a comfortable reading width (max-width: 1200px inside the content area).
* **Laptop (1024px - 1439px)**: 12 columns, 16px gutter. Collapsible sidebar logic kicks in.
* **Tablet (768px - 1023px)**: 8 columns, 16px gutter. Drawer sidebar.
* **Mobile (< 768px)**: 4 columns, 16px gutter. Slide-over sidebar.

---

## 6. Border Radius System

Minimalist, rounded shapes to feel modern but structured.

* **None (0px)**: Edge-to-edge elements
* **Small (4px)**: Checkboxes, small badges
* **Medium (6px)**: Buttons, inputs, standard UI controls
* **Large (10px)**: Dropdowns, Modals, inner card elements
* **Card (16px)**: Main cards, outer layout boundaries
* **Full (9999px)**: Avatars, circular buttons

---

## 7. Shadow System

Shadows are used exclusively to indicate elevation and interaction depth, never for purely decorative purposes.

* **sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` - Buttons, Inputs
* **md**: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)` - Dropdowns, small popovers
* **lg**: `0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)` - Drawers, Toast notifications
* **xl**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` - Modals, Dialogs

> [!NOTE]
> In Dark Mode, shadows are generally less visible. Rely on border outlines (e.g., `border-neutral-800`) to separate elevated surfaces in dark mode.

---

## 8. Elevation System

* **Level 0 (Base)**: Main app background (Neutral 50 / Neutral 950)
* **Level 1 (Surface)**: Cards, Sidebars (Neutral 0 / Neutral 900)
* **Level 2 (Popout)**: Dropdowns, Select Menus (Requires `shadow-md` + Border)
* **Level 3 (Overlay)**: Modals, Dialogs, Drawers (Requires `shadow-xl` + Border + Dimmed Backdrop)

---

## 9. Motion System

Animations should be subtle, fast, and productive. They should feel instantaneous but not harsh.

* **Duration**:
  * Fast (Hover states, Toggles): `100ms - 150ms`
  * Medium (Dropdowns, Drawers): `200ms - 250ms`
  * Slow (Page transitions, Modals): `300ms`
* **Easing**:
  * Default (Linear-like): `cubic-bezier(0.4, 0, 0.2, 1)`
  * Entrance/Exit (Spring-like): `cubic-bezier(0.16, 1, 0.3, 1)`

* **Interactions**: Buttons subtly change background color or opacity. Scale effects should be avoided for primary productivity UI.

---

## 10. Iconography

* **Library**: `lucide-react`
* **Stroke Width**: `1.5px` (for a clean, sharp look at small sizes)
* **Sizes**: 
  * 16x16: Standard buttons, dense lists
  * 20x20: Sidebar, loose buttons
  * 24x24: Section headers, empty states
  * 48x48: Major empty states, success screens

---

## 11. Accessibility Standards

* All interactive elements must have a distinct `:focus-visible` ring. Example: `ring-2 ring-primary ring-offset-2`.
* All forms must support submission via `Enter`.
* Modals must trap focus and close on `Escape`.
* ARIA labels must be present for icon-only buttons.
* Toast messages should not contain the only instance of critical actions.
* Never use color as the *only* indicator of status (e.g., use a Warning Icon + Amber Color).

---

## 12. Dark Mode Guidelines

* **Pure black (`#000000`) should be avoided** for backgrounds. Use `#09090B` or `#18181B`.
* **Desaturate colors**: Semantic colors (red, green, blue) must be desaturated in dark mode to avoid visual vibration against dark backgrounds.
* **Elevation**: Use 1px borders (`border-neutral-800`) rather than drop shadows to distinguish floating elements in dark mode.

---

## 13. Responsive Design Rules

* **Desktop First**: Layouts are designed for 1440px+ first.
* Data tables should compress horizontally using standard column truncations before switching to stacked mobile views.
* Sidebars must collapse to icons on smaller screens, and hide completely into a Hamburger menu on mobile.
* Padding decreases on smaller breakpoints (e.g., `p-6` on desktop becomes `p-4` on mobile).

---

## 14. UI Consistency Rules

* **Buttons**: 
  * Place primary actions on the right (or top in vertical stacks).
  * Only one primary button per view/section.
* **Forms**:
  * Labels above inputs.
  * Helper text below inputs.
  * Validation errors appear inline, directly beneath the input in Red.
* **Modals**:
  * Actions in the footer. Cancel on left/ghost, Confirm on right/primary.
* **Empty States**:
  * Always include: An icon, a clear heading, a brief explanation, and a primary CTA to resolve the empty state.
* **Data Density**:
  * In tables, stick to 14px font, 40px row height for standard view, 32px for compact view.
