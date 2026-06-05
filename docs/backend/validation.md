# Backend Validation

## Table of Contents
- [Overview](#overview)
- [Validation Mechanism](#validation-mechanism)
- [Implemented Schema Areas](#implemented-schema-areas)

## Overview
Request validation is implemented with Zod and the shared `validate(schema)` middleware.

## Validation Mechanism
- Schema files live in `backend/src/modules/*/*.validators.ts`
- Route handlers explicitly attach `validate(...)`
- The middleware validates `req.body`, `req.query`, and `req.params`
- On success it replaces the request objects with parsed values
- On failure it returns a `400 Validation error`

## Implemented Schema Areas
- auth: signup, login, workspace switch, password reset, verification
- organizations: create/update organization, invite member, update member, transfer ownership
- roles: create/update role
- invitations: accept invitation
- customers: create/update/list/id
- vendors: create/update/list/id
- products: create/update/list/id, category create/update/list/id
- inventory: stock adjustment, transfer, item list, movement list
- invoices: create/update/list/id
- payments: create/list
- expenses: create/list
- taxes: create/update/list/id
- transactions: list
- reports: date-range queries
