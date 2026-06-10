# Libraries & Utilities

---

## `src/lib/` – Low-Level Libraries

### `bcrypt.ts` – Password Hashing

| Function | Signature | Description |
|---|---|---|
| `hashPassword` | `(password: string) → Promise<string>` | Hashes password using bcrypt with 12 salt rounds |
| `comparePassword` | `(password: string, hash: string) → Promise<boolean>` | Constant-time comparison of plaintext against hash |

---

### `jwt.ts` – JSON Web Token Operations

| Function | Signature | Description |
|---|---|---|
| `signToken` | `(payload, secret, options?) → string` | Signs a JWT using HMAC SHA-256 (`HS256`) |
| `verifyToken<T>` | `(token, secret) → T` | Verifies and decodes a JWT, returns typed payload |

Uses the `jsonwebtoken` library. Throws on invalid/expired tokens.

---

### `cookies.ts` – Auth Cookie Management

| Function | Description |
|---|---|
| `setAuthCookies(res, refreshToken, csrfToken)` | Sets `refreshToken` (httpOnly, secure, sameSite=Strict, 7d maxAge) and `csrfToken` (non-httpOnly for JS access) cookies |
| `clearAuthCookies(res)` | Clears both auth cookies |
| `setRefreshCookie(res, token)` | Sets only the refresh token cookie |
| `clearRefreshCookie(res)` | Clears only the refresh token cookie |

**Security Properties:**
- `refreshToken` cookie: `httpOnly`, `secure` (in production), `sameSite: Strict`
- `csrfToken` cookie: **NOT** httpOnly (must be readable by frontend JS for double-submit pattern)

---

### `storage/storage.service.ts` – File Storage Abstraction

Provider-based storage system with pluggable backends.

#### `StorageProvider` Interface
| Method | Description |
|---|---|
| `upload(file, key)` | Upload a file buffer with metadata |
| `delete(key)` | Delete a file by key |
| `getUrl(key)` | Get public/signed URL for a file |
| `exists(key)` | Check if file exists |

#### `LocalStorageProvider`
- Stores files in `uploads/` directory relative to project root
- Creates directories recursively
- Returns relative paths for URL serving

#### `S3StorageProvider`
- Uses AWS SDK v3 (`@aws-sdk/client-s3`)
- Supports signed URLs via `@aws-sdk/s3-request-presigner`
- Configurable bucket, region, and credentials
- Signed URL TTL: 3600 seconds

#### `storageService` Singleton
Selects provider based on `STORAGE_PROVIDER` env var (`local` or `s3`).

| Method | Description |
|---|---|
| `uploadFile(file, directory)` | Upload with auto-generated key (UUID + original name) |
| `deleteFile(key)` | Delete by key |
| `getFileUrl(key)` | Get URL |
| `fileExists(key)` | Check existence |

---

## `src/utils/` – Shared Utilities

### `ApiError.ts` – Custom Error Class

```typescript
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Record<string, any>;
}
```

Used throughout the codebase for controlled error responses. The `isOperational` flag distinguishes expected errors from bugs.

**Factory Methods:**
| Method | Description |
|---|---|
| `ApiError.badRequest(message, details?)` | 400 error |
| `ApiError.unauthorized(message?)` | 401 error |
| `ApiError.forbidden(message?)` | 403 error |
| `ApiError.notFound(message?)` | 404 error |
| `ApiError.conflict(message?)` | 409 error |
| `ApiError.tooMany(message?)` | 429 error |
| `ApiError.internal(message?)` | 500 error |

---

### `apiResponse.ts` – Standardized API Responses

| Function | Description |
|---|---|
| `sendSuccess(res, options)` | Returns `{ success: true, message, data }` with status code |
| `sendError(res, statusCode, message, details?)` | Returns `{ success: false, message, details }` |

---

### `asyncHandler.ts` – Async Route Wrapper

```typescript
const asyncHandler = (fn: RequestHandler) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Wraps async Express route handlers to forward promise rejections to the error middleware.

---

## `src/shared/` – Shared Constants & Utilities

### `constants/permissions.ts` – Permission Definitions

Defines all 36 permission strings used across the RBAC system:

| Category | Permissions |
|---|---|
| **Organization** | `organization.view`, `organization.update`, `organization.delete`, `organization.settings` |
| **Members** | `member.view`, `member.invite`, `member.update`, `member.remove` |
| **Audit** | `audit.read` |
| **Roles** | `roles.view`, `roles.create`, `roles.update`, `roles.delete` |
| **Ownership** | `ownership.transfer` |
| **Inventory** | `inventory.view/create/update/delete` |
| **Products** | `products.view/create/update/delete` |
| **Customers** | `customers.view/create/update/delete` |
| **Vendors** | `vendors.view/create/update/delete` |
| **Sales** | `sales.view/create/update/delete` |
| **Purchasing** | `purchasing.view/create/update/delete` |
| **Finance** | `finance.view/create/update/delete` |
| **Reports** | `reports.view`, `reports.export` |

---

### `constants/rbac.ts` – Role-Based Access Control Matrix

**System Roles:** `owner`, `admin`, `manager`, `member`

**Permission Matrix (simplified):**

| Permission Area | Owner | Admin | Manager | Member |
|---|:---:|:---:|:---:|:---:|
| Organization CRUD | ✅ All | ✅ View/Update/Settings | ✅ View | ✅ View |
| Organization Delete | ✅ | ❌ | ❌ | ❌ |
| Members | ✅ All | ✅ All | ✅ View/Invite | ✅ View |
| Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Roles | ✅ All | ✅ View | ✅ View | ✅ View |
| Ownership Transfer | ✅ | ❌ | ❌ | ❌ |
| Products | ✅ All | ✅ All | ✅ View/Create/Update | ✅ View |
| Inventory | ✅ All | ✅ All | ✅ View/Create/Update | ✅ View |
| Sales | ✅ All | ✅ All | ✅ View/Create/Update | ✅ View |
| Finance | ✅ All | ✅ All | ✅ View/Create/Update | ✅ View |
| Reports | ✅ View/Export | ✅ View/Export | ✅ View/Export | ✅ View |

**Protected Permissions** (cannot be assigned to custom roles):
- `ownership.transfer`
- `organization.delete`

**Custom Role Limit:** 50 per organization

---

### `utils/permissions.ts` – Permission Cache

| Function | Description |
|---|---|
| `getCachedMemberPermissions(memberId)` | Fetches permissions from Redis cache (5 min TTL), falling back to DB query |
| `clearMemberPermissionCache(memberId)` | Invalidates cache for a single member |
| `clearMembersPermissionCache(memberIds[])` | Batch invalidation |
| `hasPermission(perms, perm)` | Check single permission |
| `hasAnyPermission(perms, perms[])` | Check any of multiple permissions |
| `hasAllPermissions(perms, perms[])` | Check all of multiple permissions |

---

### `utils/pagination.ts` – Pagination Helper

#### `parsePagination(input: { page?, limit? })`
Parses and sanitizes pagination parameters from query strings.

| Output | Description |
|---|---|
| `page` | Parsed page number (min 1) |
| `limit` | Parsed page size (min 1, max 100, default 20) |
| `skip` | Calculated offset for Prisma `skip` |
| `take` | Same as `limit` for Prisma `take` |

---

### `utils/slug.ts` – URL Slug Generator

#### `slugify(value: string): string`
Converts text to URL-safe slug: lowercase, non-alphanumeric → hyphens, trim, deduplicate hyphens.

```
"My Cool Org!" → "my-cool-org"
```

---

### `utils/audit.ts` – Audit Logging Helper

#### `createAuditLog(payload, tx?)`
Thin wrapper around `auditService.record()` with a slightly different parameter shape (`actorUserId` instead of `userId`). Used in shared utility contexts.
