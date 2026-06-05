# Project Documentation

## Table of Contents
- [Overview](#overview)
- [Documentation Map](#documentation-map)
- [Status Notes](#status-notes)
- [Source of Truth](#source-of-truth)

## Overview
This `/docs` tree documents the current implementation of the ERP repository in `backend/` and `frontend/`.

The documentation is based only on source files, routes, schemas, services, components, Prisma schema, and tests that currently exist in the repository.

## Documentation Map
- [Architecture](./architecture/frontend-architecture.md)
- [Backend](./backend/api-reference.md)
- [Frontend](./frontend/routing.md)
- [Database](./database/prisma-schema.md)
- [Business Modules](./business/customers.md)
- [Deployment](./deployment/docker.md)

## Status Notes
- Documents mark missing implementation as `Status: Planned`.
- `backend/dist/` is a generated build artifact and is not treated as the primary source of truth.
- `frontend/legacy-app/` and `frontend/legacy-components/` exist in the repository, but the active implemented frontend documented here is the App Router application under `frontend/src/`.

## Source of Truth
Primary sources used for this documentation:
- `backend/src/**`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/**`
- `backend/tests/**`
- `frontend/src/**`
- `frontend/package.json`
- `backend/package.json`
- `backend/Dockerfile`
- `backend/docker-compose.yml`
- `backend/docker-compose.test.yml`
