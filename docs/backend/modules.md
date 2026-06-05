# Backend Modules

## Table of Contents
- [Module Inventory](#module-inventory)
- [Functional Summary](#functional-summary)

## Module Inventory
Implemented backend modules:
- `auth`
- `organizations`
- `roles`
- `permissions`
- `invitations`
- `customers`
- `vendors`
- `products`
- `inventory`
- `invoices`
- `payments`
- `expenses`
- `taxes`
- `transactions`
- `reports`

## Functional Summary
| Module | Purpose | Key Files |
|---|---|---|
| `auth` | identity, sessions, verification, password reset, workspace switching | `auth.routes.ts`, `auth.service.ts`, `auth.repository.ts` |
| `organizations` | organization lifecycle and membership operations | `organization.routes.ts`, `organization.service.ts`, `organization.middleware.ts` |
| `roles` | tenant role creation/update/delete | `role.routes.ts`, `role.service.ts`, `role.repository.ts` |
| `permissions` | permission listing | `permission.routes.ts`, `permission.service.ts` |
| `invitations` | invitation acceptance | `invitation.routes.ts`, `invitation.service.ts` |
| `customers` | CRM-lite customer records and ledgers | `customer.routes.ts`, `customer.service.ts`, `customer.repository.ts` |
| `vendors` | vendor records and vendor ledgers | `vendor.routes.ts`, `vendor.service.ts`, `vendor.repository.ts` |
| `products` | products and product categories | `product.routes.ts`, `product.service.ts`, `product.repository.ts` |
| `inventory` | stock listing, movements, adjustment, transfer | `inventory.routes.ts`, `inventory.service.ts`, `inventory.repository.ts` |
| `invoices` | invoice creation, listing, detail, update | `invoice.routes.ts`, `invoice.service.ts`, `invoice.repository.ts` |
| `payments` | payment recording and listing | `payment.routes.ts`, `payment.service.ts`, `payment.repository.ts` |
| `expenses` | expense creation and listing | `expense.routes.ts`, `expense.service.ts`, `expense.repository.ts` |
| `taxes` | tax CRUD | `tax.routes.ts`, `tax.service.ts`, `tax.repository.ts` |
| `transactions` | financial transaction listing | `transaction.routes.ts`, `transaction.service.ts`, `transaction.repository.ts` |
| `reports` | dashboard/sales/expense/inventory/tax reports | `report.routes.ts`, `report.service.ts`, `report.repository.ts` |
