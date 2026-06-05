# Frontend UI Components

## Table of Contents
- [Overview](#overview)
- [Layout Components](#layout-components)
- [UI Primitives](#ui-primitives)
- [State Components](#state-components)

## Overview
Reusable UI is split between layout components, primitive UI controls, and feature-specific composition components.

## Layout Components
Implemented in `src/components/layout`:
- `app-shell.tsx`
- `sidebar.tsx`
- `top-navbar.tsx`
- `topbar.tsx`
- `page-header.tsx`
- `breadcrumb.tsx`
- `search-bar.tsx`
- `workspace-switcher.tsx`
- `profile-menu.tsx`
- `notification-center.tsx`
- `command-palette.tsx`

## UI Primitives
Implemented in `src/components/ui`:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`
- `select.tsx`
- `table.tsx`
- `textarea.tsx`
- `badge.tsx`
- `avatar.tsx`

These primitives are reused heavily across customer, vendor, product, inventory, invoice, purchase, and transaction features.

## State Components
Implemented in `src/components/states`:
- `empty-state.tsx`
- `module-loading.tsx`
- `module-error.tsx`
