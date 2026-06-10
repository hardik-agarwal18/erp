# Entry Points & Configuration

---

## `src/server.ts` – Server Bootstrap

The main entry point that orchestrates startup and graceful shutdown.

### `startServer(): Promise<void>`
Boots the entire application in sequence:
1. **Connects Redis** – `connectRedis()`
2. **Verifies SMTP** – `verifyMailConnection()` (exits on failure)
3. **Starts BullMQ workers** – `startWorkers()`
4. **Starts scheduler** – `startScheduler()`
5. **Listens on port** – `app.listen(env.PORT)`

### `shutdown(signal: string): Promise<void>`
Graceful shutdown handler registered for `SIGTERM`, `SIGINT`, `unhandledRejection`, and `uncaughtException`:
1. Closes HTTP server
2. Shuts down BullMQ workers
3. Closes queue connections
4. Disconnects Prisma
5. Quits Redis

---

## `src/app.ts` – Express Application

Creates and configures the Express app with the full middleware stack and route registry.

### Middleware Stack (in order)
| Middleware | Purpose |
|---|---|
| **Request ID** (`crypto.randomUUID()`) | Assigns unique ID per request via `AsyncLocalStorage` |
| **pino-http** | Structured HTTP request/response logging |
| **helmet** | Security headers |
| **cors** | Cross-origin configuration (reads `CORS_ORIGIN` env) |
| **express.json** | Body parser (10kb limit) |
| **express.urlencoded** | URL-encoded body parser |
| **cookie-parser** | Parse cookies for refresh token flows |
| **sanitizeMiddleware** | Strips null bytes and trims all string values |
| **apiRateLimiter** | Global rate limiting on `/api` routes |

### Route Registry

| Path | Module |
|---|---|
| `/api/v1/admin/queues` | BullBoard dashboard (basic auth) |
| `/api/v1/queues` | Queue observability endpoint |
| `/api/v1/health` | Health check |
| `/api/v1/auth` | Authentication |
| `/api/v1/demo` | Demo data seeding |
| `/api/v1/organizations` | Organization management |
| `/api/v1/roles` | RBAC role management |
| `/api/v1/permissions` | Permission listing |
| `/api/v1/invitations` | Invitation acceptance |
| `/api/v1/customers` | Customer CRUD |
| `/api/v1/vendors` | Vendor CRUD |
| `/api/v1/products` | Product & category CRUD |
| `/api/v1/inventory` | Inventory management |
| `/api/v1/invoices` | Invoice CRUD |
| `/api/v1/payments` | Payment recording |
| `/api/v1/expenses` | Expense tracking |
| `/api/v1/taxes` | Tax rate management |
| `/api/v1/transactions` | Financial transactions |
| `/api/v1/reports` | Reports & dashboard |
| `/api/v1/storage/*` | Static file serving (uploads) |
| `/metrics` | Prometheus metrics endpoint |

---

## `src/config/env.ts` – Environment Validation

Uses **Zod** to validate and parse all environment variables at startup. Throws immediately on invalid config.

### Key Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `development\|test\|production` | `development` | Runtime environment |
| `PORT` | `number` | `5000` | HTTP server port |
| `DATABASE_URL` | `string (url)` | *required* | PostgreSQL connection string |
| `REDIS_URL` | `string (url)` | *required* | Redis connection string |
| `JWT_ACCESS_SECRET` | `string` | *required* | HMAC secret for access tokens |
| `JWT_REFRESH_SECRET` | `string` | *required* | HMAC secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | `string` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `string` | `7d` | Refresh token TTL |
| `COOKIE_SECRET` | `string` | *required* | Cookie signing secret |
| `STORAGE_PROVIDER` | `local\|s3` | `local` | File storage provider |
| `MAIL_ENABLED` | `boolean` | `true` | Enable/disable email sending |
| `SMTP_HOST` | `string` | *required if mail enabled* | SMTP server host |
| `SMTP_PORT` | `number` | *required if mail enabled* | SMTP server port |
| `RATE_LIMIT_ENABLED` | `boolean` | `true` | Enable/disable rate limiting |
| `RATE_LIMIT_MAX` | `number` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `number` | `15` | Window size in minutes |
| `LOG_LEVEL` | `string` | `info` | Pino log level |

### Conditional Validation
- When `STORAGE_PROVIDER=s3`: `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` are required
- When `MAIL_ENABLED=true`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` are required

---

## `src/config/database.ts` – Database Client

Re-exports the extended Prisma client from `database/extensions.ts` with tenant scoping and soft-delete support.

### Exports
| Export | Description |
|---|---|
| `prisma` | Extended Prisma client (default export) |
| `DatabaseClient` | Type alias for the extended client |
| `DatabaseTransactionClient` | Type for use inside `$transaction` callbacks |
| `connectDatabase()` | Opens DB connection |
| `disconnectDatabase()` | Closes DB connection |

---

## `src/config/logger.ts` – Structured Logging

Creates a **Pino** logger with:
- **AsyncLocalStorage context** – Automatically includes `reqId`, `userId`, `workspaceId` in every log line
- **Sensitive field redaction** – Removes `password`, `token`, `refreshToken`, `accessToken`, `csrfToken`, cookies
- **Pretty printing** in development via `pino-pretty`
- **JSON output** in production

### `loggerContext: AsyncLocalStorage<Map<string, string>>`
Shared async-local storage used by middleware to propagate request context to all downstream log calls.

---

## `src/config/redis.ts` – Redis Client

Configures a `redis` (node-redis) client with:
- Reconnection strategy (exponential backoff, max 3s)
- Event handlers for connect, ready, reconnecting, error, end

### Exported Functions

| Function | Description |
|---|---|
| `connectRedis()` | Opens Redis connection (exits process on failure) |
| `disconnectRedis()` | Gracefully closes Redis |
| `checkRedisHealth()` | Returns `true` if `PING` → `PONG` |
| `registerRedisShutdown()` | Registers SIGINT/SIGTERM handlers |
| `redisClient` | The Redis client instance |

---

## `src/config/mail.ts` – SMTP Configuration

Configures Nodemailer transporter with connection pooling.

### Exported Functions

| Function | Description |
|---|---|
| `verifyMailConnection()` | Verifies SMTP connectivity on startup |
| `checkMailHealth()` | Health check for SMTP (used by health endpoint) |
| `closeMailTransport()` | Closes SMTP transporter |
| `transporter` | Nodemailer transporter instance |
| `mailConfig` | SMTP configuration object |
| `mailFrom` | Sender email address from `MAIL_FROM` env |
