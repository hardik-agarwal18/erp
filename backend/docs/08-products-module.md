# Products Module

**Location:** `src/modules/products/`

Manages product catalogs and categories. Supports both physical products and services. Automatically integrates with the Inventory module for physical products to ensure stock tracking is initialized correctly upon product creation or type changes.

---

## Files

| File | Purpose | Lines of Code / Complexity |
|---|---|---|
| `product.service.ts` | Core business logic including cross-module transaction orchestration (Inventory/Audit) and data integrity assertions. | ~285 lines |
| `product.controller.ts` | HTTP layer mapping request parameters to service calls, standardizing success/error responses. | ~85 lines |
| `product.routes.ts` | Express router wiring, injecting `authMiddleware` and `tenantContextMiddleware` alongside specific RBAC permission checks. | ~40 lines |
| `product.repository.ts` | Database abstraction layer wrapping Prisma calls and leveraging `BaseRepository` for multi-tenant safe soft deletes. | ~218 lines |
| `product.types.ts` | TypeScript interface definitions for data payloads and filter criteria. | ~30 lines |
| `product.validators.ts` | Exact Zod schema definitions used to parse and validate incoming HTTP request payloads. | ~82 lines |

---

## Routes

| Method | Path | Auth | Permission | Controller Function | Description |
|---|---|---|---|---|---|
| `POST` | `/products` | ✅ | `products.create` | `createProduct` | Create a new product. Initializes inventory if physical. |
| `GET` | `/products` | ✅ | `products.view` | `listProducts` | List products with pagination and fuzzy search filters. |
| `GET` | `/products/:id` | ✅ | `products.view` | `getProduct` | Get specific product details by UUID. |
| `PATCH` | `/products/:id` | ✅ | `products.update` | `updateProduct` | Update a product's details and adjust inventory relations if type changes. |
| `DELETE` | `/products/:id` | ✅ | `products.delete` | `archiveProduct` | Soft-delete a product. |
| `POST` | `/products/categories` | ✅ | `products.create` | `createCategory` | Create a new product category. |
| `GET` | `/products/categories` | ✅ | `products.view` | `listCategories` | List categories alphabetically with pagination. |
| `PATCH` | `/products/categories/:id` | ✅ | `products.update` | `updateCategory` | Update a category's name or description. |
| `DELETE` | `/products/categories/:id` | ✅ | `products.delete` | `archiveCategory` | Soft-delete a category. |

Legend: ✅ = Requires both `authMiddleware` (valid session) and `tenantContextMiddleware` (valid organization context).

---

## Types (`product.types.ts`)

### `CreateProductInput`
Used when creating a new product.
```typescript
{
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice?: number;
  taxId?: string;
  categoryId?: string;
  type: "PHYSICAL" | "SERVICE";
}
```

### `UpdateProductInput`
All fields become optional during a PATCH request.
```typescript
Partial<CreateProductInput>
```

### `ProductFilters`
Used internally by the repository to construct the `where` clause.
```typescript
{
  search?: string;
  type?: "PHYSICAL" | "SERVICE";
  categoryId?: string;
}
```

### `CreateCategoryInput` / `UpdateCategoryInput`
```typescript
{
  name: string;
  description?: string;
}
// Update makes all fields optional
```

---

## Exact Validators (`product.validators.ts`)

All incoming requests are strictly validated using Zod. Unrecognized fields are stripped.

| Schema | Validates | Exact Zod Constraints |
|---|---|---|
| `createProductSchema` | `body` | `name`: string, min 2, max 120.<br>`sku`: string, max 64, optional.<br>`description`: string, max 500, optional.<br>`unit`: string, max 32, optional.<br>`sellingPrice`: number, min 0.<br>`purchasePrice`: number, min 0, optional.<br>`taxId`: string, valid UUID, optional.<br>`categoryId`: string, valid UUID, optional.<br>`type`: exact enum `"PHYSICAL" \| "SERVICE"`. |
| `updateProductSchema` | `params`, `body` | `params.id`: valid UUID.<br>`body`: All fields from `createProductSchema` made `.optional()`. |
| `productIdParamSchema` | `params` | `params.id`: valid UUID. |
| `listProductsSchema` | `query` | `page`: string, optional.<br>`limit`: string, optional.<br>`search`: string, max 120, optional.<br>`type`: exact enum `"PHYSICAL" \| "SERVICE"`, optional.<br>`categoryId`: string, valid UUID, optional. |
| `createCategorySchema` | `body` | `name`: string, min 2, max 120.<br>`description`: string, max 255, optional. |
| `updateCategorySchema` | `params`, `body` | `params.id`: valid UUID.<br>`body`: `name` (min 2, max 120, optional), `description` (max 255, optional). |
| `categoryIdParamSchema` | `params` | `params.id`: valid UUID. |
| `listCategoriesSchema` | `query` | `page`: string, optional.<br>`limit`: string, optional.<br>`search`: string, max 120, optional. |

---

## Service Functions (`product.service.ts`)

The service layer contains all business logic, transactional boundaries, and cross-module integrity checks.

### Internal Validation Helpers
- **`assertTaxInOrganization(organizationId, taxId?)`**: Queries Prisma `tax` table to ensure the `taxId` exists, belongs to the current `organizationId`, and is not deleted. Throws `ApiError(404, "Tax not found")` if invalid.
- **`assertCategoryInOrganization(organizationId, categoryId?)`**: Queries Prisma `productCategory` table to ensure the `categoryId` exists and is valid for the current org. Throws `ApiError(404, "Category not found")`.

### `productService.createProduct(organizationId, actorUserId, payload)`
1. Calls `assertCategoryInOrganization()` and `assertTaxInOrganization()` to guarantee referential integrity.
2. Initiates a `prisma.$transaction`.
3. Calls `tx.product.create()` mapping payload fields directly.
4. **Cross-Module Logic:** If `payload.type === "PHYSICAL"`, it automatically calls `tx.inventoryItem.create()` to initialize an inventory tracking record for this product with `quantity: 0`.
5. Calls `auditService.record()` using `tx` to log `AUDIT_ACTIONS.PRODUCT_CREATED` against `AUDIT_ENTITY_TYPES.PRODUCT`.
6. Returns the completed product object.

### `productService.updateProduct(organizationId, actorUserId, productId, payload)`
1. Uses `productRepository.findById()` to check if product exists. Throws `ApiError(404, "Product not found")` if missing.
2. Calls `assertCategoryInOrganization()` and `assertTaxInOrganization()` on the new incoming payload references.
3. Initiates a `prisma.$transaction`.
4. Calls `tx.product.update()` to patch the product data.
5. **Cross-Module Logic:** If `payload.type === "PHYSICAL"` (e.g. they changed a service to a physical product), it checks if an `inventoryItem` exists for this product. If not, it creates one with `quantity: 0` to prevent inventory lookup crashes later.
6. Calls `auditService.record()` to log `AUDIT_ACTIONS.PRODUCT_UPDATED`.
7. Returns the updated product object.

### `productService.archiveProduct(organizationId, actorUserId, productId)`
1. Looks up the product. Throws `404` if not found.
2. Calls `productRepository.archiveProduct()`, which sets `deletedAt = NOW()`.
3. Calls `auditService.record()` to log `AUDIT_ACTIONS.PRODUCT_ARCHIVED`.

### `productService.listProducts(organizationId, filters, query)`
Passes through directly to `productRepository.listProducts()`.

### `productService.getProduct(organizationId, productId)`
Passes through to `productRepository.findById()`. Throws `ApiError(404, "Product not found")` if null.

### Category Management (`createCategory`, `updateCategory`, `archiveCategory`, `listCategories`)
Follows identical patterns to products: validates existence → modifies database via repository → records Audit Event (`CATEGORY_CREATED`, `CATEGORY_UPDATED`, `CATEGORY_ARCHIVED`) → returns data.

---

## Repository Functions (`product.repository.ts`)

Abstracts the database layer. Instances of `BaseRepository` are used to handle multi-tenant isolation implicitly.

- **`productCrudRepository`**: Instantiated with `prisma.product`, `softDelete: true`, and `tenantScoped: true`.
- **`productCategoryCrudRepository`**: Instantiated with `prisma.productCategory`, `softDelete: true`, and `tenantScoped: true`.

| Function | Under The Hood |
|---|---|
| `createProduct` | Calls `productCrudRepository.create()`. |
| `updateProduct` | Calls raw `prisma.product.update()`. |
| `findById` | Calls raw `prisma.product.findFirst({ where: { id: productId, organizationId, deletedAt: null } })`. |
| `listProducts` | Uses `parsePagination(query)`. Constructs a `where` clause using `buildProductFilter`. Executes `prisma.$transaction([ findMany, count ])`. `findMany` includes `{ category: true, tax: true }` and uses `mode: "insensitive"` for `name` and `sku` wildcard searches. Returns `{ items, total, page, limit }`. |
| `archiveProduct` | Calls `productCrudRepository.archiveById()`. |
| `listCategories` | Uses `parsePagination`. Sorts by `name: "asc"`. Executes `prisma.$transaction([ findMany, count ])`. Uses `mode: "insensitive"` for `name` searches. |

---

## Controller Functions (`product.controller.ts`)

Controllers are purely responsible for extracting parameters from Express `req` objects and sending structured `res` responses via the `sendSuccess` utility. Errors are caught by a global async error handler middleware.

| Controller | HTTP Status | Response Data payload |
|---|---|---|
| `createProduct` | `201 Created` | The created `product` object |
| `updateProduct` | `200 OK` | The updated `product` object |
| `archiveProduct`| `200 OK` | `{ message: "Product archived" }` (No data body) |
| `listProducts` | `200 OK` | Paginated array object: `{ items: [], total: N, page: N, limit: N }` |
| `getProduct` | `200 OK` | The specific `product` object |
| `createCategory`| `201 Created` | The created `category` object |
| `updateCategory`| `200 OK` | The updated `category` object |
| `archiveCategory`| `200 OK` | `{ message: "Category archived" }` |
| `listCategories`| `200 OK` | Paginated array object: `{ items: [], total: N, page: N, limit: N }` |
