# Frontend Redesign Master Plan

This document outlines the comprehensive strategy and implementation plan to transform the ERP frontend into a world-class enterprise SaaS product, aligning with the visual standards of platforms like Linear, Vercel, and Stripe.

## Overview

The redesign will be executed in four primary phases to ensure stability while completely overhauling the visual and user experience (UX/UI) layers. We will meticulously preserve all existing business logic, routing, and API contracts.

> [!IMPORTANT]
> Because of the sheer scale of the application (15+ feature modules), attempting to rewrite every single page in one massive pass is highly risky. I propose an iterative approach where we establish the foundation and then sweep through the pages one by one or in functional batches.

## Phase 1: Design System Foundation (Tokens & Theming)
We will establish the core design language in `tailwind.config.ts` and `src/app/globals.css`.

### Proposed Changes
- **Spacing Scale**: Implement the strict `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` scale.
- **Typography**: Integrate the `Inter` font family and establish a strict typography hierarchy (Display, H1-H4, Body, Small, Caption).
- **Colors**: Refine the enterprise palette. Move away from default Radix/Tailwind hues to a curated, high-contrast, professional palette with distinct light/dark modes.
- **Radii & Shadows**: Introduce `6px, 10px, 14px, 16px` border radii and a subtle 4-tier shadow system.

#### [MODIFY] `tailwind.config.ts`
- Inject spacing constraints.
- Map custom shadow values (`shadow-sm`, `shadow-md`, `shadow-lg`).
- Set border radius tokens.
- Add modern animations and keyframes for modals, tooltips, and page transitions.

#### [MODIFY] `src/app/globals.css`
- Import `Inter` font.
- Refine root CSS variables for the color palette, ensuring WCAG contrast compliance.

## Phase 2: Component Library Refactoring
We will audit and refactor the base UI components in `src/components/ui/` to ensure they are beautiful, accessible, and robust.

### Proposed Changes
- **Buttons**: Add subtle micro-interactions, distinct variants (Primary, Secondary, Ghost, Destructive), and loading states.
- **Inputs & Forms**: Implement floating labels or clear inline validation, focus rings, and proper error/success states.
- **Cards**: Standardize headers, content padding (using the exact spacing scale), and footers.
- **Badges/Alerts**: Create distinct, soft-colored variants for Success, Warning, Error, Info.
- **Tables**: Enhance the base table component to support sticky headers, dense/comfortable spacing, and hover states optimized for scanning.

#### [MODIFY] `src/components/ui/button.tsx`
#### [MODIFY] `src/components/ui/input.tsx`
#### [MODIFY] `src/components/ui/card.tsx`
#### [MODIFY] `src/components/ui/badge.tsx`
#### [NEW] Additional components (Modals, Dropdowns, Tooltips, Toasts) using Radix UI primitives with the new styling.

## Phase 3: Layout System (Desktop-First)
The App Shell is the most critical part of the initial impression. We will overhaul `AppShell`, `Sidebar`, and `TopNavbar`.

### Proposed Changes
- **Sidebar**: Transform the current dark sidebar into a collapsible, elegant navigation panel (akin to Linear/Notion). We'll add subtle hover states, active indicators, and ensure smooth collapsing transitions.
- **Top Navigation**: Implement a sticky header featuring a unified global search bar (cmd/ctrl+K), breadcrumbs, and user controls.
- **Content Area**: Ensure CSS Grid/Flexbox layouts with a constrained max-width (or fluid with proper padding) for ultra-wide monitors.

#### [MODIFY] `src/components/layout/app-shell.tsx`
#### [MODIFY] `src/components/layout/sidebar.tsx`
#### [MODIFY] `src/components/layout/top-navbar.tsx`

## Phase 4: Page-by-Page UX Execution
Once the foundation, components, and layout are solid, we will execute the UX improvements on specific application pages. 

For each page (e.g., Dashboard, Invoices, Customers), we will:
1. Provide a quick audit (Empty states, Error states, Loading skeletons).
2. Refactor the layout using the new design system.
3. Optimize tables for data density and fast scanning.
4. Improve form flows.

> [!TIP]
> We will start with the **Dashboard** and **Transactions/Purchases** (as you currently have them open) to demonstrate the new standard.

## User Review Required

> [!WARNING]
> Please confirm if you are okay with an **iterative execution strategy**. I will build Phase 1, Phase 2, and Phase 3 first. Once the core layout and components are beautiful, I will proceed to refactor the individual pages (Phase 4) iteratively, starting with the Dashboard.

## Verification Plan
### Automated & Manual Verification
- **Visual Regression**: I will check the rendering of the `AppShell` and core components.
- **Accessibility**: Verify contrast ratios and keyboard navigation on newly refactored components.
- **Functionality**: Ensure that clicking links in the sidebar still navigates properly without breaking Next.js routing.
