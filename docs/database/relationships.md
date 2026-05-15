# Database Relationships

## Table of Contents
- [High-Level Relationships](#high-level-relationships)
- [Tenant-Scoped Relationships](#tenant-scoped-relationships)

## High-Level Relationships
- A `User` can own many `Organization` records.
- A `User` can belong to many organizations through `OrganizationMember`.
- An `OrganizationMember` belongs to one `Role`.
- A `Role` gains many `Permission` values through `RolePermission`.
- An `Organization` owns nearly all business records.
- A `Customer` has many `Invoice` records.
- An `Invoice` has many `InvoiceItem` and `Payment` records.
- A `Product` can belong to one `ProductCategory` and one `Tax`.
- A `Product` has one `InventoryItem`.
- A `Vendor` can be referenced by many `Expense` records.

## Tenant-Scoped Relationships
Every business record is linked to `Organization` through `organizationId`, which is the core tenant boundary in the schema.
