# Backend Testing

## Table of Contents
- [Overview](#overview)
- [Structure](#structure)
- [Coverage Areas](#coverage-areas)
- [Helpers](#helpers)

## Overview
The backend uses Jest with `ts-jest` and separates tests into `unit` and `integration`.

## Structure
```text
backend/tests/
├─ fixtures/
├─ helpers/
├─ integration/
├─ setup/
└─ unit/
```

## Coverage Areas
Observed implemented suites:
- auth:
  - signup
  - login
  - refresh
  - switch workspace
- organizations:
  - create organization
  - invite member
  - remove member
  - workspace isolation
- middleware:
  - auth middleware
  - tenant middleware
  - rate limit middleware
- permissions:
  - permission middleware
  - role access
  - privilege escalation
- accounting:
  - accounting flow
- unit:
  - auth utils
  - slug utility

## Helpers
Implemented helpers and setup files:
- `tests/setup/env.ts`
- `tests/setup/setup.ts`
- `tests/setup/testDb.ts`
- `tests/setup/seedTestData.ts`
- `tests/helpers/auth.helper.ts`
- `tests/helpers/token.helper.ts`
- `tests/helpers/organization.helper.ts`
- `tests/helpers/permission.helper.ts`

Integration tests use dedicated test PostgreSQL and Redis services, documented in `backend/tests/README.md`.
