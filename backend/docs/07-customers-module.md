# Customers Module

**Location:** `src/modules/customers/`

Manages customer records, profiles, and tracks customer ledgers (balance limits, payment histories, and outstanding invoices).

---

## Files

| File | Purpose |
|---|---|
| `customer.service.ts` | Customer business logic and ledger calculation |
| `customer.controller.ts` | HTTP request/response handling |
| `customer.routes.ts` | Express route definitions with permission guards |
| `customer.repository.ts` | Prisma data access for customers |
| `customer.types.ts` | TypeScript interfaces for customer payloads |
| `customer.validators.ts` | Zod schemas for request validation |
| `customer.middleware.ts` | Module-specific middleware |

---

## Routes

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/customers` | ✅ | `customers.create` | Create a new customer |
| `GET` | `/customers` | ✅ | `customers.view` | List all customers with pagination/search |
| `GET` | `/customers/:id` | ✅ | `customers.view` | Get customer details by ID |
| `PATCH` | `/customers/:id` | ✅ | `customers.update` | Update an existing customer |
| `DELETE` | `/customers/:id` | ✅ | `customers.update` | Archive/soft-delete a customer |
| `GET` | `/customers/:id/ledger` | ✅ | `customers.view` | Get financial ledger for a customer |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`customer.types.ts`)

### `CreateCustomerInput`
```typescript
{
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
}
```

### `UpdateCustomerInput`
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
}
```

### `CustomerFilters`
```typescript
{
  search?: string;
}
```

---

## Validators (`customer.validators.ts`)

| Schema | Validates |
|---|---|
| `createCustomerSchema` | `body: { name: min 2, email: valid email, phone: 6-30 chars, gstNumber: 3-32 chars, address: max 255 chars, creditLimit: min 0 }` |
| `updateCustomerSchema` | `params: { id: UUID }`, `body: { name?: min 2, email?: valid email, phone?: 6-30 chars, gstNumber?: 3-32 chars, address?: max 255 chars, creditLimit?: min 0 }` |
| `customerIdParamSchema` | `params: { id: UUID }` |
| `listCustomersSchema` | `query: { page?: string, limit?: string, search?: max 120 chars }` |

---

## Service Functions (`customer.service.ts`)

### `customerService.createCustomer(organizationId, actorUserId, payload)`
Registers a new customer profile.
1. Creates customer record via `customerRepository.createCustomer()`
2. Records `CUSTOMER_CREATED` audit event using `auditService`
3. Returns the newly created customer object

### `customerService.updateCustomer(organizationId, actorUserId, customerId, payload)`
Updates an existing customer's details.
1. Checks for customer existence via `customerRepository.findById()` → throws `404` if not found
2. Updates customer record via `customerRepository.updateCustomer()`
3. Records `CUSTOMER_UPDATED` audit event
4. Returns the updated customer object

### `customerService.archiveCustomer(organizationId, actorUserId, customerId)`
Soft-deletes a customer profile.
1. Checks for customer existence via `customerRepository.findById()` → throws `404` if not found
2. Marks customer as deleted via `customerRepository.archiveCustomer()`
3. Records `CUSTOMER_ARCHIVED` audit event

### `customerService.listCustomers(organizationId, filters, query)`
Retrieves a paginated list of customers.
1. Passes `organizationId`, `filters` (like `search`), and pagination `query` to `customerRepository.listCustomers()`
2. Returns paginated data (`items`, `total`, `page`, `limit`)

### `customerService.getCustomerById(organizationId, customerId)`
Retrieves a specific customer's details.
1. Fetches customer via `customerRepository.findById()`
2. Throws `404` if customer does not exist
3. Returns customer object

### `customerService.getLedger(organizationId, customerId)`
Calculates the financial standing of a customer by aggregating their invoices and payments.
1. Validates customer exists via `customerRepository.findById()` → throws `404` if missing
2. Initiates a `prisma.$transaction` to perform 4 parallel read queries:
   - Fetches all invoices (`findMany`) ordered by `issueDate` desc
   - Fetches all payments (`findMany`) ordered by `paymentDate` desc (includes invoice relations)
   - Aggregates (`_sum`) `totalAmount` across all invoices
   - Aggregates (`_sum`) `amount` across all payments
3. Calculates `outstandingBalance` (`totalInvoiced - totalPaid`) and `creditBalance`
4. Returns `{ customer, invoices, payments, outstandingBalance, creditBalance }`

---

## Repository Functions (`customer.repository.ts`)

Leverages `BaseRepository` with `softDelete: true` and `tenantScoped: true` configuration for foundational CRUD operations.

| Function | Description |
|---|---|
| `createCustomer(orgId, payload)` | Maps input to Prisma create payload |
| `updateCustomer(orgId, id, payload)` | Maps input to Prisma update payload using base repo |
| `findById(orgId, id)` | Uses base repo to find active customer |
| `listCustomers(orgId, filters, query)` | Performs paginated search using `prisma.$transaction` (findMany + count). Uses `mode: 'insensitive'` to match `name`, `email`, `phone`, or `gstNumber` |
| `archiveCustomer(orgId, id)` | Uses base repo to softly delete |
| `restoreCustomer(orgId, id)` | Uses base repo to restore soft deleted customer |

---

## Controller Functions (`customer.controller.ts`)

| Function | Key Behavior |
|---|---|
| `createCustomer` | Returns 201 Created with created customer data |
| `getCustomerById` | Returns 200 OK with customer profile |
| `updateCustomer` | Returns 200 OK with updated customer profile |
| `archiveCustomer` | Returns 200 OK with success message (no data body) |
| `listCustomers` | Returns 200 OK with paginated list array |
| `getLedger` | Returns 200 OK with complex ledger object |
