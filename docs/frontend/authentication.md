# Frontend Authentication

## Table of Contents
- [Current State](#current-state)
- [Implemented Pieces](#implemented-pieces)
- [Missing Live Auth Integration](#missing-live-auth-integration)

## Current State
Status: Planned

The active frontend does not implement a real login/logout/session flow against the backend.

## Implemented Pieces
- `WorkspaceProvider` simulates:
  - a current session
  - two available workspaces
  - role-based feature gating
- `useRbac(feature)` exposes simple UI gating

## Missing Live Auth Integration
Not implemented in current frontend source:
- login page
- signup page
- refresh-token client flow
- cookie-aware API client
- protected route redirects
- backend-driven workspace switch requests
