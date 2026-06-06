# Frontend Organization Workflow & Transition Audit

**Date:** 2026-06-06
**Scope:** Frontend implementation of Organization Workflow, Transformation, and Transition Guide

## Coverage Matrix

| Workflow | Implemented | Partial | Missing | Notes |
| -------- | ----------- | ------- | ------- | ----- |
| Organization Creation & Setup | | ✓ | | Creation UI exists (`/onboarding`). Settings are read-only. |
| User Onboarding & Invitations | | | ✓ | Hook exists (`inviteMember`), but UI button has no handler. |
| Workspace Switching | ✓ | | | `<WorkspaceSwitcher>` works and updates state. |
| Role Assignment & Permission Transformation | | | ✓ | Hook exists, but UI button has no handler. No permission-based rendering found. |
| Ownership Transfer | | | ✓ | Hook exists, but UI button has no handler. |
| Organizational Restructuring | | | ✓ | No team/department management UI. |
| Member Offboarding | | ✓ | | Remove member works via `window.confirm`. Lacks robust confirmation dialog. |
| Organization Deletion / Deactivation | | | ✓ | Delete button exists in UI but has no handler. |
| Migration & Transition UX | | ✓ | | Onboarding exists, but no transition guides or tooltips. |
| Accessibility | | ✓ | | Native selects used, but `window.confirm` is poor UX. |
| Responsive Design | | ✓ | | Good container usage (`max-w-5xl`), role badges hide on mobile. |
| State Management | | ✓ | | React Query cache invalidation is implemented on mutation success. |
| Security / RBAC | | | ✓ | Privileged buttons (Remove, Transfer) appear visible to all roles. |
| Audit & Activity Visibility | | | ✓ | No activity feed or audit log UI implemented for org events. |

## File Analysis

*   `d:\erp\frontend\src\app\onboarding\page.tsx`: Implements the initial workspace creation flow for new users.
*   `d:\erp\frontend\src\components\layout\workspace-switcher.tsx`: Provides a `<Select>` dropdown to toggle the active workspace context.
*   `d:\erp\frontend\src\features\organizations\components\settings-members-view.tsx`: The primary UI for member management. Displays members in a `DataTable`, but lacks actual handlers for "Invite", "Change Role", and "Transfer Ownership".
*   `d:\erp\frontend\src\features\organizations\components\settings-organization-view.tsx`: Displays organization profile info but lacks form inputs for editing. "Delete Workspace" button is non-functional.
*   `d:\erp\frontend\src\features\organizations\components\settings-roles-view.tsx`: Placeholder empty state for custom roles.
*   `d:\erp\frontend\src\features\organizations\hooks\use-organizations.ts`: Defines `react-query` mutations (`inviteMember`, `updateMemberRole`, `removeMember`, `transferOwnership`) and cache invalidation logic.

## Issues Found

### 1. Inoperable Action Buttons
*   **Severity:** Critical
*   **Description:** Multiple primary action buttons in `settings-members-view.tsx` and `settings-organization-view.tsx` lack `onClick` handlers.
*   **Impact:** Users cannot invite members, change roles, transfer ownership, or delete the workspace.
*   **Recommended Fix:** Implement dialogs/modals for these actions and wire them to the existing `useOrganizationMutations` hooks.
*   **File Location:** `settings-members-view.tsx`, `settings-organization-view.tsx`

### 2. Lack of Permission-Based UI Rendering
*   **Severity:** High
*   **Description:** Privileged actions like "Remove Member" and "Transfer Ownership" are rendered for all users regardless of their role.
*   **Impact:** Non-admins may attempt restricted actions (leading to backend 403s) and the UI is confusing.
*   **Recommended Fix:** Wrap privileged UI elements in a permission-checking component (e.g., `<RequireRole role="admin">`).
*   **File Location:** `settings-members-view.tsx`, `settings-organization-view.tsx`

### 3. Read-Only Organization Settings
*   **Severity:** Medium
*   **Description:** The organization profile view (`settings-organization-view.tsx`) displays the company name as a static `div` rather than an editable form.
*   **Impact:** Users cannot rename their workspaces or change base currency.
*   **Recommended Fix:** Replace static `div` elements with `react-hook-form` inputs and a "Save Changes" mutation.
*   **File Location:** `settings-organization-view.tsx`

### 4. Poor UX for Destructive Actions
*   **Severity:** Low
*   **Description:** "Remove Member" relies on a native browser `window.confirm` dialog.
*   **Impact:** Looks unprofessional, lacks detailed warnings, and breaks immersion.
*   **Recommended Fix:** Implement a custom `<ConfirmDialog>` component from the UI library.
*   **File Location:** `settings-members-view.tsx`

## Missing Features

The following requirements from the workflow document are missing from the frontend:
*   Editable organization profile settings.
*   Invitation dialog/form and validation.
*   Pending invitation management list.
*   Role assignment/update dialogs.
*   Ownership transfer confirmation dialog and acceptance flow.
*   Organization deletion confirmation modal and recovery flow.
*   Department/team management screens (Organizational Restructuring).
*   Audit and activity logs view.
*   Tooltips, in-app guided tours, and progressive disclosure for transition UX.

## UX Improvements

1.  **Empty States:** Add a dedicated empty state for pending invitations if none exist, rather than combining them with the active members list.
2.  **Destructive Actions:** Use a "Type 'DELETE' to confirm" modal for deleting workspaces and transferring ownership.
3.  **Feedback:** Add `toast` notifications for all mutations (`onSuccess` and `onError`). Currently, mutations just invalidate queries silently.

## Security Findings

1.  **UI Exposure:** Role restrictions are not enforced on the frontend. The "Transfer Ownership" and "Delete Workspace" UI components are fully exposed.
2.  **Session Invalidation:** There is no evidence of frontend session invalidation or forced refresh handling when a user's role is transformed or when they are removed.

## Final Score

*   **Workflow Coverage:** 20%
*   **UX Score:** 4/10
*   **Accessibility Score:** 5/10
*   **Security Score:** 3/10
*   **Production Readiness Score:** 2/10
