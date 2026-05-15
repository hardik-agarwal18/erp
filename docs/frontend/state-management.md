# Frontend State Management

## Table of Contents
- [Overview](#overview)
- [Implemented State Tools](#implemented-state-tools)
- [Not Implemented](#not-implemented)

## Overview
The frontend uses a small combination of React Query and React Context.

## Implemented State Tools
### React Query
- Provider: `src/providers/query-provider.tsx`
- Library: `@tanstack/react-query`
- Default query settings:
  - `staleTime: 60000`
  - `refetchOnWindowFocus: false`
  - `retry: 1`

### Workspace context
- Provider: `src/providers/workspace-provider.tsx`
- Holds:
  - current workspace
  - available workspaces
  - mock session
  - `setWorkspaceById`
  - `canAccess(feature)`

### UI context
- Provider: `src/store/ui-store.tsx`
- Holds:
  - `commandOpen`
  - `setCommandOpen`

## Not Implemented
Status: Planned

The following are not implemented in the active frontend source:
- Redux store
- Zustand store
- live backend session persistence on the client
