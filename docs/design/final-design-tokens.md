# Final Design Token Specification

## Color System

### Light Theme
- **Background**: `#FAFAFA` (Neutral 50) - App backdrop.
- **Surface**: `#FFFFFF` (Neutral 0) - Cards and panels.
- **Elevated Surface**: `#FFFFFF` (Neutral 0) - Modals/Dropdowns (relies on shadow).
- **Primary**: `#09090B` (Neutral 950) - Primary buttons, active states.
- **Secondary**: `#F4F4F5` (Neutral 100) - Secondary buttons, hover backgrounds.
- **Success**: `#10B981` (Green 500) - Paid invoices, positive trends.
- **Warning**: `#F59E0B` (Amber 500) - Pending states, stock alerts.
- **Error**: `#EF4444` (Red 500) - Overdue bills, destructive actions.
- **Info**: `#3B82F6` (Blue 500) - Links, focused rings.
- **Borders**: `#E4E4E7` (Neutral 200) - Dividers, card outlines.
- **Text Primary**: `#09090B` (Neutral 950) - Main text, headings.
- **Text Secondary**: `#71717A` (Neutral 500) - Subtitles, helper text.
- **Text Tertiary**: `#A1A1AA` (Neutral 400) - Placeholders, disabled text.

### Dark Theme
- **Background**: `#09090B` (Neutral 950) - App backdrop.
- **Surface**: `#18181B` (Neutral 900) - Cards and panels.
- **Elevated Surface**: `#27272A` (Neutral 800) - Modals/Dropdowns.
- **Primary**: `#FAFAFA` (Neutral 50) - Primary buttons.
- **Secondary**: `#27272A` (Neutral 800) - Secondary buttons.
- **Success**: `#059669` (Green 600) - Adjusted for dark mode contrast.
- **Warning**: `#D97706` (Amber 600) - Adjusted for dark mode contrast.
- **Error**: `#DC2626` (Red 600) - Adjusted for dark mode contrast.
- **Info**: `#60A5FA` (Blue 400) - Links, focused rings.
- **Borders**: `#3F3F46` (Neutral 700) - Dividers, card outlines.
- **Text Primary**: `#FAFAFA` (Neutral 50) - Main text.
- **Text Secondary**: `#A1A1AA` (Neutral 400) - Subtitles.
- **Text Tertiary**: `#71717A` (Neutral 500) - Placeholders.

*Reasoning*: The palette moves away from heavily saturated blues/purples to a stark, high-contrast monochrome base (Neutrals 0-950) typical of linear/vercel aesthetics, ensuring maximum readability for dense data. Semantic colors are reserved purely for status.

---

## Typography System
**Font Family**: `Inter`

| Level | Font Size | Line Height | Weight |
| :--- | :--- | :--- | :--- |
| **Display** | 36px (2.25rem) | 40px (2.5rem) | 600 (Semibold) |
| **H1** | 24px (1.5rem) | 32px (2rem) | 600 (Semibold) |
| **H2** | 20px (1.25rem) | 28px (1.75rem) | 600 (Semibold) |
| **H3** | 16px (1rem) | 24px (1.5rem) | 500 (Medium) |
| **H4** | 14px (0.875rem) | 20px (1.25rem) | 500 (Medium) |
| **Body Large**| 16px (1rem) | 24px (1.5rem) | 400 (Regular) |
| **Body** | 14px (0.875rem) | 20px (1.25rem) | 400 (Regular) |
| **Small** | 12px (0.75rem) | 16px (1rem) | 400 (Regular) |
| **Caption** | 11px (0.6875rem)| 16px (1rem) | 500 (Medium) |

---

## Spacing System
Strict adherence to the 4px baseline grid.

- **4px** (`1`): Icon spacing within buttons.
- **8px** (`2`): Inner padding for inputs and tight cells.
- **12px** (`3`): Standard gap between form elements.
- **16px** (`4`): Card padding (Mobile/Dense), main layout gaps.
- **20px** (`5`): Relaxed padding for large buttons.
- **24px** (`6`): Standard Card padding (Desktop).
- **32px** (`8`): Section breaks within a page.
- **40px** (`10`): Major layout padding (e.g., App Shell margins).
- **48px** (`12`): Hero section padding.
- **64px** (`16`): Bottom padding for scrolling clearance.

---

## Radius System
- **Small** (`0.25rem` / 4px): Checkboxes, badges, tiny UI elements.
- **Medium** (`0.375rem` / 6px): Buttons, Inputs, standard interactive controls.
- **Large** (`0.5rem` / 8px): Dropdowns, Tooltips, small internal cards.
- **Card** (`0.75rem` / 12px): Standard cards, panels, sidebar menu groups.
- **Modal** (`1rem` / 16px): Large dialogs, drawers, main app shell boundaries.

---

## Shadow System
- **xs**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Subtle depth for buttons/inputs).
- **sm**: `0 4px 6px -1px rgb(0 0 0 / 0.05)` (Hover states for interactive cards).
- **md**: `0 10px 15px -3px rgb(0 0 0 / 0.05)` (Dropdowns, Command Palette).
- **lg**: `0 20px 25px -5px rgb(0 0 0 / 0.1)` (Modals, Dialogs, Toasts).

---

## Motion System
- **Duration**: Fast (150ms) for micro-interactions; Normal (200ms) for panels; Slow (300ms) for page transitions.
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` default; `cubic-bezier(0.16, 1, 0.3, 1)` for bouncy entrances.
- **Hover interactions**: Opacity or background-color fades only. No scaling (to maintain tight ERP layouts).
- **Modal transitions**: Fade in + slight scale up (95% -> 100%).
- **Drawer transitions**: Slide in from right (100% -> 0%).
