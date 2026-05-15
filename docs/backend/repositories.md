# Backend Repositories

## Table of Contents
- [Overview](#overview)
- [Repository Inventory](#repository-inventory)

## Overview
Repository files encapsulate Prisma access per module. They are the main persistence abstraction in the backend source tree.

## Repository Inventory
Implemented repository files:
- `auth.repository.ts`
- `organization.repository.ts`
- `role.repository.ts`
- `customer.repository.ts`
- `vendor.repository.ts`
- `product.repository.ts`
- `inventory.repository.ts`
- `invoice.repository.ts`
- `payment.repository.ts`
- `expense.repository.ts`
- `tax.repository.ts`
- `transaction.repository.ts`
- `report.repository.ts`

Common patterns inferred from the repository layout and module wiring:
- Prisma CRUD with tenant scoping
- soft-delete filtering for archived business records
- list operations with pagination helpers from `shared/utils/pagination.ts`
- relationship loading for details, ledgers, and reports
