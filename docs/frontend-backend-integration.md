# Frontend-Backend Integration Map

This document reflects the current live integration state in the repository as of 2026-05-29.

## Shared Platform

| Frontend Area | Frontend File | Backend Endpoint |
| --- | --- | --- |
| API client | `frontend/src/api/client.ts` | `NEXT_PUBLIC_API_URL` base URL |
| Login | `frontend/src/app/login/page.tsx` | `POST /api/v1/auth/login` |
| Signup | `frontend/src/app/signup/page.tsx` | `POST /api/v1/auth/signup` |
| Logout | `frontend/src/components/layout/profile-menu.tsx` | `POST /api/v1/auth/logout` |
| Session restore | `frontend/src/providers/workspace-provider.tsx` | `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me` |
| Workspace switching | `frontend/src/providers/workspace-provider.tsx` | `POST /api/v1/auth/switch-workspace` |
| Permission loading | `frontend/src/providers/workspace-provider.tsx` | `GET /api/v1/permissions` |

## Business Modules

| Frontend Feature | Frontend Service | Backend Endpoint(s) |
| --- | --- | --- |
| Dashboard | `frontend/src/features/dashboard/service.ts` | `GET /api/v1/reports/dashboard`, `GET /api/v1/reports/inventory`, `GET /api/v1/reports/sales` |
| Customers list/detail/create/update | `frontend/src/features/customers/service.ts` | `GET /api/v1/customers`, `GET /api/v1/customers/:id/ledger`, `POST /api/v1/customers`, `PATCH /api/v1/customers/:id` |
| Vendors list/detail/create/update | `frontend/src/features/vendors/service.ts` | `GET /api/v1/vendors`, `GET /api/v1/vendors/:id/ledger`, `POST /api/v1/vendors`, `PATCH /api/v1/vendors/:id` |
| Products list/detail/create/update | `frontend/src/features/products/service.ts` | `GET /api/v1/products`, `GET /api/v1/products/categories`, `GET /api/v1/inventory/items`, `POST /api/v1/products`, `PATCH /api/v1/products/:id` |
| Inventory dashboard | `frontend/src/features/inventory/service.ts` | `GET /api/v1/inventory/items`, `GET /api/v1/inventory/movements` |
| Stock adjustments | `frontend/src/features/inventory/service.ts` | `POST /api/v1/inventory/adjustments` |
| Stock transfers | `frontend/src/features/inventory/service.ts` | `POST /api/v1/inventory/transfers` |
| Invoices list/detail | `frontend/src/features/invoices/service.ts` | `GET /api/v1/invoices`, `GET /api/v1/invoices/:id` |
| Invoice create | `frontend/src/features/invoices/components/invoice-create-view.tsx` | `POST /api/v1/invoices` |
| Invoice update | `frontend/src/features/invoices/components/invoice-edit-view.tsx` | `PATCH /api/v1/invoices/:id` |
| Transactions list/dashboard/detail lookup | `frontend/src/features/transactions/service.ts` | `GET /api/v1/transactions` |

## Unsupported Frontend Routes

These routes now fail truthfully against backend capability instead of using mock data:

| Frontend Route Area | Reason |
| --- | --- |
| Purchases / goods received notes | No purchase-order or GRN backend module exists |
| Inventory audit scheduling | No backend audit endpoint exists |
| Warehouse management | No backend warehouse-management endpoint exists |
| Bank reconciliation | No backend reconciliation endpoint exists |
