# Frontend API Integration

## Table of Contents
- [Overview](#overview)
- [Implemented Integration Pattern](#implemented-integration-pattern)
- [Not Implemented](#not-implemented)

## Overview
The active frontend does not implement a live HTTP API client in `frontend/src`.

## Implemented Integration Pattern
- `src/services/mock-api.ts` provides `mockFetch`
- feature services return mock data structures after simulated delays
- feature hooks wrap those services with React Query
- cache keys are defined in `src/lib/query-keys.ts`

This means the current frontend is wired as a mock-backed UI layer rather than a real backend consumer.

## Not Implemented
Status: Planned

Not present in current source:
- axios/fetch API client module
- request/response interceptors
- token injection
- refresh-token handling on the client
- error normalization layer for backend responses
