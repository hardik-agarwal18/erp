# Backend Services

## Table of Contents
- [Overview](#overview)
- [Implemented Services](#implemented-services)

## Overview
Service files sit between controllers and repositories. They own business orchestration, side effects, and cross-resource workflows.

## Implemented Services
| Service | Responsibilities observed in code |
|---|---|
| `auth.service.ts` | signup, login, logout, logout-all, refresh rotation, workspace switching, email verification, resend verification, forgot/reset password, current-user lookup |
| `organization.service.ts` | organization CRUD, membership management, invitations, ownership transfer, leave flow |
| `role.service.ts` | tenant role CRUD and permission assignment |
| `permission.service.ts` | permission enumeration |
| `invitation.service.ts` | invitation acceptance flow |
| `customer.service.ts` | customer CRUD, listing, ledger retrieval |
| `vendor.service.ts` | vendor CRUD, listing, ledger retrieval |
| `product.service.ts` | product CRUD, category CRUD, list operations |
| `inventory.service.ts` | inventory list, movement list, adjust stock, transfer stock |
| `invoice.service.ts` | create invoice, list invoices, get invoice, update invoice |
| `payment.service.ts` | create payment, list payments |
| `expense.service.ts` | create expense, list expenses |
| `tax.service.ts` | tax CRUD and listing |
| `transaction.service.ts` | transaction listing |
| `report.service.ts` | sales, expenses, inventory, tax, and dashboard reporting |

Cross-module services:
- `mail/mail.service.ts`
- shared utility services via `shared/utils/**`
