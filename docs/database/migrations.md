# Database Migrations

## Table of Contents
- [Overview](#overview)
- [Implemented Migrations](#implemented-migrations)

## Overview
Prisma migrations live in `backend/prisma/migrations`.

## Implemented Migrations
### `20260528182723_init`
Introduced:
- `User`
- `RefreshSession`
- `EmailVerificationToken`
- `PasswordResetToken`

### `20260528192143_multi_tenant_foundation`
Introduced multi-tenant foundation tables:
- `Organization`
- `OrganizationMember`
- `Role`
- `Permission`
- `RolePermission`
- `Invitation`
- `RefreshSession.activeOrganizationId`

Status: Planned

The current migration directory does not contain later SQL migrations for the full business schema visible in `schema.prisma`. The schema is implemented, but only these two migration directories are present in the repository.
