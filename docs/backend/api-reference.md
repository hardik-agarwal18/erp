# Backend API Reference

## Table of Contents
- [Conventions](#conventions)
- [Health](#health)
- [Auth](#auth)
- [Organizations and Access](#organizations-and-access)
- [Core Business Modules](#core-business-modules)
- [Reporting](#reporting)

## Conventions
- Base path: `/api/v1`
- Protected routes require `Authorization: Bearer <access-token>`
- Tenant-aware routes also require organization context through token state, `x-organization-id`, or route param depending on middleware usage
- Standard success envelope: `{ success: true, data?, message? }`
- Standard validation/auth failure envelope: `{ success: false, message, details? }`

## Health
### `GET /health`
- Auth: none
- Response: `{ success: true, message: "OK" }`

## Auth
### `POST /api/v1/auth/signup`
- Auth: none
- Request schema: `signupSchema`
- Body:
  - `name: string`
  - `email: string`
  - `password: string`
- Response: `201` with verification message

### `POST /api/v1/auth/login`
- Auth: none
- Request schema: `loginSchema`
- Body:
  - `email: string`
  - `password: string`
- Response:
  - `accessToken`
  - `user`
  - `organizations`
  - `activeOrganization`
  - refresh and CSRF cookies

### `POST /api/v1/auth/logout`
- Auth: bearer access token
- Response: clears auth cookies

### `POST /api/v1/auth/logout-all`
- Auth: bearer access token
- Response: revokes all refresh sessions for the user

### `POST /api/v1/auth/refresh`
- Auth: refresh cookie + `x-csrf-token`
- Response: new `accessToken` plus rotated cookies

### `POST /api/v1/auth/switch-workspace`
- Auth: bearer access token + refresh cookie + `x-csrf-token`
- Request schema: `switchWorkspaceSchema`
- Body:
  - `organizationId: uuid`
- Response:
  - new `accessToken`
  - `activeOrganization`
  - `organizations`

### `POST /api/v1/auth/forgot-password`
- Auth: none
- Request schema: `forgotPasswordSchema`

### `POST /api/v1/auth/reset-password`
- Auth: none
- Request schema: `resetPasswordSchema`
- Body:
  - `token`
  - `password`

### `GET /api/v1/auth/verify-email`
- Auth: none
- Request schema: `verifyEmailSchema`
- Query:
  - `token`

### `POST /api/v1/auth/resend-verification`
- Auth: none
- Request schema: `resendVerificationSchema`

### `GET /api/v1/auth/me`
- Auth: bearer access token
- Response:
  - current user
  - `organizations`
  - `activeOrganization`

## Organizations and Access
### Organizations
- `POST /api/v1/organizations`
  - Auth: access token
  - Validation: `createOrganizationSchema`
  - Permission: none beyond authentication
- `GET /api/v1/organizations`
  - Auth: access token
- `GET /api/v1/organizations/:id`
  - Auth: access token
  - Validation: `organizationIdParamSchema`
  - Permission: `organization.view`
- `PATCH /api/v1/organizations/:id`
  - Permission: `organization.update`
  - Validation: `updateOrganizationSchema`
- `DELETE /api/v1/organizations/:id`
  - Role: `owner`
  - Permission: `organization.delete`
- `GET /api/v1/organizations/:id/members`
  - Permission: `organization.members`
- `POST /api/v1/organizations/:id/members/invite`
  - Permission: `organization.invitations`
  - Validation: `inviteMemberSchema`
- `PATCH /api/v1/organizations/:id/members/:memberId`
  - Permission: `organization.members`
  - Validation: `updateMemberSchema`
- `DELETE /api/v1/organizations/:id/members/:memberId`
  - Permission: `users.delete`
- `POST /api/v1/organizations/:id/leave`
  - Validation: `organizationIdParamSchema`
- `POST /api/v1/organizations/:id/transfer-ownership`
  - Role: `owner`
  - Permission: `organization.transfer_ownership`
  - Validation: `transferOwnershipSchema`

### Roles
- `POST /api/v1/roles`
  - Permission: `roles.manage`
  - Validation: `createRoleSchema`
- `GET /api/v1/roles`
  - Permission: `permissions.view`
- `PATCH /api/v1/roles/:id`
  - Permission: `roles.manage`
  - Validation: `updateRoleSchema`
- `DELETE /api/v1/roles/:id`
  - Permission: `roles.manage`

### Permissions
- `GET /api/v1/permissions`
  - Permission: `permissions.view`

### Invitations
- `POST /api/v1/invitations/accept`
  - Auth: none
  - Validation: `acceptInvitationSchema`

## Core Business Modules
### Customers
- `POST /api/v1/customers`
  - Permission: `customers.create`
  - Validation: `createCustomerSchema`
  - Body: `name`, optional `email`, `phone`, `gstNumber`, `address`, `creditLimit`
- `GET /api/v1/customers`
  - Permission: `customers.view`
  - Validation: `listCustomersSchema`
  - Query: `page`, `limit`, `search`
- `PATCH /api/v1/customers/:id`
  - Permission: `customers.update`
  - Validation: `updateCustomerSchema`
- `DELETE /api/v1/customers/:id`
  - Permission: `customers.update`
  - Validation: `customerIdParamSchema`
- `GET /api/v1/customers/:id/ledger`
  - Permission: `customers.view`

### Vendors
- `POST /api/v1/vendors`
  - Permission: `vendors.create`
  - Validation: `createVendorSchema`
- `GET /api/v1/vendors`
  - Permission: `vendors.view`
  - Validation: `listVendorsSchema`
- `PATCH /api/v1/vendors/:id`
  - Permission: `vendors.update`
  - Validation: `updateVendorSchema`
- `DELETE /api/v1/vendors/:id`
  - Permission: `vendors.update`
- `GET /api/v1/vendors/:id/ledger`
  - Permission: `vendors.view`

### Products
- `POST /api/v1/products`
  - Permission: `products.manage`
  - Validation: `createProductSchema`
- `GET /api/v1/products`
  - Permission: `products.manage`
  - Validation: `listProductsSchema`
- `PATCH /api/v1/products/:id`
  - Permission: `products.manage`
  - Validation: `updateProductSchema`
- `DELETE /api/v1/products/:id`
  - Permission: `products.manage`
- `POST /api/v1/products/categories`
  - Validation: `createCategorySchema`
- `GET /api/v1/products/categories`
  - Validation: `listCategoriesSchema`
- `PATCH /api/v1/products/categories/:id`
  - Validation: `updateCategorySchema`
- `DELETE /api/v1/products/categories/:id`
  - Validation: `categoryIdParamSchema`

### Inventory
- `GET /api/v1/inventory/items`
  - Permission: `inventory.manage`
  - Validation: `listInventoryItemsSchema`
- `GET /api/v1/inventory/movements`
  - Permission: `inventory.manage`
  - Validation: `listInventoryMovementsSchema`
- `POST /api/v1/inventory/adjustments`
  - Permission: `inventory.manage`
  - Validation: `adjustStockSchema`
  - Body: `productId`, `quantity`, optional `referenceId`
- `POST /api/v1/inventory/transfers`
  - Permission: `inventory.manage`
  - Validation: `transferStockSchema`

### Invoices
- `POST /api/v1/invoices`
  - Permission: `invoices.create`
  - Validation: `createInvoiceSchema`
  - Body includes:
    - `customerId`
    - `issueDate`
    - optional `dueDate`
    - optional `status`
    - optional `notes`
    - `items[]` with `productId`, `quantity`, optional `unitPrice`, optional `discountAmount`
- `GET /api/v1/invoices`
  - Permission: `invoices.view`
  - Validation: `listInvoicesSchema`
- `GET /api/v1/invoices/:id`
  - Permission: `invoices.view`
- `PATCH /api/v1/invoices/:id`
  - Permission: `invoices.update`
  - Validation: `updateInvoiceSchema`

### Payments
- `POST /api/v1/payments`
  - Permission: `payments.create`
  - Validation: `createPaymentSchema`
- `GET /api/v1/payments`
  - Permission: `payments.view`
  - Validation: `listPaymentsSchema`

### Expenses
- `POST /api/v1/expenses`
  - Permission: `expenses.manage`
  - Validation: `createExpenseSchema`
- `GET /api/v1/expenses`
  - Permission: `expenses.manage`
  - Validation: `listExpensesSchema`

### Taxes
- `POST /api/v1/taxes`
  - Permission: `taxes.manage`
  - Validation: `createTaxSchema`
- `GET /api/v1/taxes`
  - Permission: `taxes.manage`
  - Validation: `listTaxesSchema`
- `PATCH /api/v1/taxes/:id`
  - Permission: `taxes.manage`
  - Validation: `updateTaxSchema`
- `DELETE /api/v1/taxes/:id`
  - Permission: `taxes.manage`
  - Validation: `taxIdParamSchema`

### Transactions
- `GET /api/v1/transactions`
  - Permission: `transactions.view`
  - Validation: `listTransactionsSchema`
  - Query: `page`, `limit`, optional `type`

## Reporting
- `GET /api/v1/reports/sales`
  - Permission: `reports.view`
  - Validation: `reportRangeSchema`
- `GET /api/v1/reports/expenses`
  - Permission: `reports.view`
  - Validation: `reportRangeSchema`
- `GET /api/v1/reports/inventory`
  - Permission: `reports.view`
- `GET /api/v1/reports/tax`
  - Permission: `reports.view`
  - Validation: `reportRangeSchema`
- `GET /api/v1/reports/dashboard`
  - Permission: `reports.view`
