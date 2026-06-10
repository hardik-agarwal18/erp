# Middleware

All middleware files are located in `src/middleware/`.

---

## `auth.middleware.ts` – JWT Authentication

### `authMiddleware(req, res, next)`
Extracts and verifies the Bearer access token from the `Authorization` header.

**Flow:**
1. Checks for `Authorization: Bearer <token>` header
2. Verifies JWT using `JWT_ACCESS_SECRET`
3. Validates `type === "access"`
4. Checks Redis blacklist (`blacklist:{jti}`) for revoked tokens
5. Populates `req.user` with `{ id, organizationId, membershipId, role }`
6. Populates `req.auth` with `{ jti, exp, token }`
7. Sets `userId` in the logger async-local context

**Errors:**
- `401 Unauthorized` – Missing/invalid/revoked token

---

## `tenant.middleware.ts` – Multi-Tenant Context

### `tenantContextMiddleware(options?)`
Factory function that returns middleware to resolve and enforce organization membership.

**Options:**
| Option | Type | Default | Description |
|---|---|---|---|
| `allowRouteParam` | `boolean` | `false` | Allow org ID from `req.params.id` |
| `enforceTokenOrganization` | `boolean` | `true` | Require token org to match requested org |

**Flow:**
1. Resolves `organizationId` from: `x-organization-id` header → route param → token claim
2. Enforces token-organization match (prevents cross-tenant access)
3. Queries `OrganizationMember` with role and organization details
4. Fetches and caches member permissions via Redis
5. Populates `req.organization`, `req.member`, `req.permissions`
6. Sets `workspaceId` in logger context

### `requireRole(...roles: string[])`
Middleware factory that rejects requests where `req.member.roleName` is not in the allowed list.

**Use:** `requireRole("owner", "admin")`

### `requirePermission(...permissions: string[])`
Middleware factory that checks `req.permissions` includes **all** of the specified permissions.

**Use:** `requirePermission(PERMISSIONS.SALES_CREATE)`

### `requireAnyPermission(...permissions: string[])`
Like `requirePermission`, but requires **any one** of the specified permissions.

---

## `validate.middleware.ts` – Zod Validation

### `validate(schema: ZodSchema)`
Generic validation middleware that parses `{ body, headers, query, params }` against a Zod schema.

**Flow:**
1. Calls `schema.safeParse({ body, headers, query, params })`
2. On failure: returns `400 Validation error` with Zod's flattened error details
3. On success: replaces `req.body`, `req.headers`, `req.query`, `req.params` with parsed/coerced values

---

## `error.middleware.ts` – Global Error Handler

### `errorMiddleware(error, req, res, next)`
Express error-handling middleware (4-argument signature).

**Behavior:**
- `ApiError` instances → uses their `statusCode` and `message`
- Other `Error` instances → `500 Internal server error` + logs stack trace
- Returns standardized JSON via `sendError()`

---

## `rateLimit.middleware.ts` – Rate Limiting

### `createApiRateLimiter(options?)`
Factory that creates an `express-rate-limit` middleware.

**Options:**
| Option | Type | Default |
|---|---|---|
| `windowMs` | `number` | `RATE_LIMIT_WINDOW * 60 * 1000` |
| `max` | `number` | `RATE_LIMIT_MAX` (default 100) |
| `enabled` | `boolean` | `RATE_LIMIT_ENABLED` |

When disabled, returns a pass-through middleware.

### `apiRateLimiter`
Pre-created instance used globally on `/api` routes.

---

## `sanitize.middleware.ts` – Input Sanitization

### `sanitizeMiddleware(req, res, next)`
Recursively sanitizes all string values in `req.body`, `req.query`, and `req.params`:
- Removes null bytes (`\0`)
- Trims whitespace

Handles nested objects and arrays.
