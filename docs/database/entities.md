# Database Entities

## Table of Contents
- [Identity and Security](#identity-and-security)
- [Tenancy and RBAC](#tenancy-and-rbac)
- [Business Domain](#business-domain)

## Identity and Security
- `User`
- `RefreshSession`
- `EmailVerificationToken`
- `PasswordResetToken`

## Tenancy and RBAC
- `Organization`
- `OrganizationMember`
- `Role`
- `Permission`
- `RolePermission`
- `Invitation`

## Business Domain
- Sales and AR:
  - `Customer`
  - `Invoice`
  - `InvoiceItem`
  - `InvoiceSequence`
  - `Payment`
  - `Transaction`
- Procurement and catalog:
  - `Vendor`
  - `ProductCategory`
  - `Product`
  - `Tax`
- Inventory:
  - `InventoryItem`
  - `InventoryMovement`
- Operational finance:
  - `Expense`
- Auditing:
  - `AuditLog`
