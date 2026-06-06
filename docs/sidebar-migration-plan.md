# Sidebar Migration Plan

## 1. Current Sidebar Structure
The current sidebar is a client-side React component (`sidebar.tsx`) that mounts on the left side of the screen.
- **Expanded Width:** 280px
- **Collapsed Width:** 88px
- **Styling:** Hardcoded dark theme (`bg-slate-950`, `text-slate-100`) without explicit dark mode semantic tokens, relying on white opacity hovers (`hover:bg-white/5`).

## 2. Current Navigation Hierarchy
The hierarchy is defined via a static `navigationSections` array.
It groups items into exactly two major sections:
1. **Operations:** Dashboard, Reports, Accounting, Inventory.
2. **Administration:** Directories, Procurement, Transactions, Audit Logs, Settings.

The hierarchy utilizes a two-level depth: Parent Node (e.g., Accounting) -> Child Nodes (e.g., Invoices).

## 3. Current Collapse Behavior
The sidebar toggles between 280px and 88px via a local `useState(false)`.
- **Limitation:** This state is wiped on full page reloads.

## 4. Current Accordion Behavior
Accordions (Accounting, Inventory, Settings) are managed by a local `expandedGroups` state initialized to `{ Accounting: true, Inventory: true }`.
- **Limitation:** Expanding "Settings" or collapsing "Inventory" does not persist across sessions.

## 5. Permission Filtering
The sidebar integrates seamlessly with `useWorkspace().canAccess(item.feature)`. If a feature key is present and the user lacks permission, the entire node (and its children) is omitted from the render tree.

## 6. Active Route Indicators
Route matching relies on a simple `.startsWith()` against `activePath`.
- **Limitation:** If a parent matches, its accordion remains open, but the active visual state is an opaque white background (`bg-white text-slate-950`) which can look extremely harsh against the dark layout, lacking enterprise-grade subtlety.

---

## Proposed Phase 3B Implementation

### 1. Width Optimization
- **Expanded:** Reduce from 280px to **260px** to reclaim horizontal content area.
- **Collapsed:** Reduce from 88px to **72px** to minimize footprint.

### 2. State Persistence
- **Collapsed State:** Implement `localStorage` binding inside a `useEffect` so the user's width preference is maintained across sessions.
- **Accordion State:** Persist the `expandedGroups` object in `localStorage` so users don't have to repeatedly open "Settings".

### 3. Favorites & Recent Pages
Because we must preserve the exact existing structure and not flatten it, we will inject a dynamic `<div className="mb-5">` at the very top of the scroll container:
- **Recent Pages:** An array in `localStorage` updated via a `useEffect` tracking `activePath`. It will store the last 5 unique routes and render them as rapid-access links at the top of the sidebar.
- **Favorites:** A user-toggled array stored in `localStorage`. We will add a small "Star" icon hover action next to standard links, pushing them into the Favorites group at the top.

### 4. Active Route & Visual Improvements
- Change the harsh `bg-white` active state to a subtle primary-tinted background (e.g., `bg-primary/10 text-primary` or `bg-white/10 border-l-2 border-primary`).
- Introduce sleek transitions (`transition-all duration-200`) for all hover states.
- Ensure the structural grouping remains visually distinct while preserving the requested logical groups (Accounting, Inventory, Sales, CRM, HR, Reports, Settings).
