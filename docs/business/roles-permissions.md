# Roles and Permissions

## Table of Contents
- [Implemented RBAC Model](#implemented-rbac-model)
- [System Roles](#system-roles)
- [Permission Families](#permission-families)

## Implemented RBAC Model
The backend defines:
- system role names in `shared/constants/rbac.ts`
- concrete permission constants in `PERMISSIONS`
- default permission sets in `SYSTEM_ROLE_PERMISSIONS`

## System Roles
- `owner`
- `admin`
- `manager`
- `member`

## Permission Families
- organization
- roles
- permissions
- users
- billing
- inventory
- workspace switching
- customers
- vendors
- products
- invoices
- payments
- expenses
- taxes
- transactions
- reports

## API Endpoints
- `GET /api/v1/permissions`
- `POST /api/v1/roles`
- `GET /api/v1/roles`
- `PATCH /api/v1/roles/:id`
- `DELETE /api/v1/roles/:id`
