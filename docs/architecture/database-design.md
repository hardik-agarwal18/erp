# Database Design

## Table of Contents
- [Overview](#overview)
- [Storage Technologies](#storage-technologies)
- [Domain Areas](#domain-areas)
- [ER Diagram](#er-diagram)
- [Constraints and Indexing](#constraints-and-indexing)

## Overview
The primary database design is defined in `backend/prisma/schema.prisma` and uses PostgreSQL through Prisma.

The application also uses Redis for:
- refresh-session cache
- access-token blacklist
- cached member permissions

## Storage Technologies
- Primary relational store: PostgreSQL
- ORM/client: Prisma
- Secondary cache/session store: Redis

## Domain Areas
Implemented Prisma models cover:
- identity and access: `User`, `RefreshSession`, `EmailVerificationToken`, `PasswordResetToken`
- tenancy and RBAC: `Organization`, `OrganizationMember`, `Role`, `Permission`, `RolePermission`, `Invitation`
- sales/accounting: `Customer`, `Invoice`, `InvoiceItem`, `InvoiceSequence`, `Payment`, `Transaction`
- procurement and catalog: `Vendor`, `ProductCategory`, `Product`, `Tax`
- inventory: `InventoryItem`, `InventoryMovement`
- operational finance: `Expense`
- auditing: `AuditLog`

## ER Diagram
```mermaid
erDiagram
User ||--o{ RefreshSession : owns
User ||--o{ EmailVerificationToken : verifies
User ||--o{ PasswordResetToken : resets
User ||--o{ Organization : owns
User ||--o{ OrganizationMember : joins
User ||--o{ Invitation : sends
User ||--o{ AuditLog : acts

Organization ||--o{ OrganizationMember : contains
Organization ||--o{ Role : defines
Organization ||--o{ Invitation : issues
Organization ||--o{ Customer : owns
Organization ||--o{ Vendor : owns
Organization ||--o{ ProductCategory : owns
Organization ||--o{ Product : owns
Organization ||--o{ InventoryItem : owns
Organization ||--o{ InventoryMovement : owns
Organization ||--o{ Tax : owns
Organization ||--o{ Invoice : owns
Organization ||--|| InvoiceSequence : sequences
Organization ||--o{ Payment : owns
Organization ||--o{ Expense : owns
Organization ||--o{ Transaction : owns
Organization ||--o{ AuditLog : owns

Role ||--o{ OrganizationMember : assigned
Role ||--o{ Invitation : defaults
Role ||--o{ RolePermission : grants
Permission ||--o{ RolePermission : granted

Customer ||--o{ Invoice : billed
Tax ||--o{ Product : taxes
Tax ||--o{ Invoice : taxes
ProductCategory ||--o{ Product : categorizes
Product ||--|| InventoryItem : tracks
Product ||--o{ InventoryMovement : moves
Product ||--o{ InvoiceItem : sold
Invoice ||--o{ InvoiceItem : contains
Invoice ||--o{ Payment : receives
Vendor ||--o{ Expense : billed
```

## Constraints and Indexing
Observed implemented patterns:
- strong unique constraints for tenant-specific natural keys such as:
  - `Organization.slug`
  - `Role(organizationId, name)`
  - `ProductCategory(organizationId, name)`
  - `Product(organizationId, sku)`
  - `Invoice(organizationId, invoiceNumber)`
- tenant-first indexes across major business models
- soft-delete timestamps on many business tables via `deletedAt`
- cascade and set-null strategies depending on retention needs
