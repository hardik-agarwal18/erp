# ERP System Design - Discovery Phase 1 (Questions 1 - 20)

Based on the current implementation of the Precision Ledger ERP codebase, here are the architectural answers to the first 20 questions regarding Multi-Tenancy.

## 1. Multi-Tenancy

**1. What are the trade-offs between shared schema, separate schema, and separate database multi-tenancy models?**
*Codebase Implementation:* The ERP implements a **shared schema, single database** model using row-level tenant IDs (`organizationId`). 
*Trade-offs:* The shared schema approach dramatically simplifies database migrations and reduces infrastructure costs. However, it introduces the risk of cross-tenant data leakage if application logic fails, and "noisy neighbor" issues are harder to isolate compared to separate databases.

**2. How would you design a tenant identification strategy (subdomain, header, JWT claim) for an API gateway?**
*Codebase Implementation:* The application resolves the tenant through a hybrid strategy defined in `tenant.middleware.ts`. It sequentially falls back through:
1. `x-organization-id` header
2. Route parameters (e.g., `/api/organizations/:id/`) if `allowRouteParam` is set.
3. The JWT token's attached `req.user.organizationId` claim.

**3. How do you prevent cross-tenant data leakage when using a shared database with row-level tenant IDs?**
*Codebase Implementation:* Cross-tenant leakage is prevented entirely at the **application layer**. The `BaseRepository` primitive automatically intercepts queries and applies an `organizationId` scope constraint. Methods like `buildScopedWhere` and `mergeWhere` ensure that every CRUD operation is strictly scoped to the tenant context before hitting Prisma. PostgreSQL Row-Level Security (RLS) is not currently enabled.

**4. How would you implement tenant-aware connection pooling in a microservices architecture?**
*Codebase Implementation:* Because the ERP operates on a shared database model, connection pooling is handled globally by the Prisma Client (`config/database.ts`). Tenant-aware connection pools are unnecessary in this specific architecture, as all tenants share the same connection string.

**5. What is "noisy neighbor" risk in multi-tenant systems, and how do you mitigate it?**
*Codebase Implementation:* "Noisy neighbor" happens when one tenant's heavy workload starves resources (CPU, DB connections) for other tenants. Currently, the system mitigates this broadly via IP-based rate limiting (`express-rate-limit` in `rateLimit.middleware.ts`). Strict tenant-by-tenant throttling and compute isolation are not yet implemented.

**6. How would you design tenant onboarding so that provisioning a new tenant is fully automated?**
*Codebase Implementation:* Provisioning is handled in the IAM domain. When an `Organization` is created, it is inserted into the shared schema, and an `OrganizationMember` relationship is automatically generated mapping the creator to an Owner/Admin role, instantly initializing the tenant.

**7. How do you handle tenant-specific configuration (feature flags, business rules, currency, locale)?**
*Codebase Implementation:* The `Organization` model contains a `settings` JSON field. The `tenant.middleware.ts` attaches `req.organization.settings` to the request context upon authentication, making these parameters easily accessible to downstream business logic.

**8. What strategies exist for migrating a tenant from a shared schema to a dedicated database as they scale?**
*Codebase Implementation:* Currently, the ERP lacks an explicit sharding or ejection mechanism to migrate a tenant to a dedicated database. 

**9. How would you design database indexes and partitioning to keep queries efficient with millions of tenant rows?**
*Codebase Implementation:* The `schema.prisma` relies on standard indexing. To maintain performance, the `organizationId` foreign key is consistently included in indices alongside specific query parameters, but database-level table partitioning is not yet utilized.

**10. How do you enforce tenant isolation at the application layer vs. the database layer (e.g., RLS in Postgres)?**
*Codebase Implementation:* The application enforces strict **application-layer isolation**. Database-layer isolation (RLS) is not implemented. `tenant.middleware.ts` rejects any request lacking an active `OrganizationMember` link, and the `BaseRepository` forces the resulting `organizationId` into all queries.

**11. How would you design a tenant-aware caching layer (Redis) to avoid cache key collisions?**
*Codebase Implementation:* `CacheService` (`cache.service.ts`) prevents collisions by standardizing the cache key format. Every key is prefixed using `org:${options.organizationId}:${options.domain}:${options.resource}`.

**12. What are the implications of multi-tenancy on background jobs and schedulers?**
*Codebase Implementation:* Background jobs (utilizing BullMQ) must reconstruct the tenant context. Job payloads must inherently pass the `organizationId` so workers can instantiate the tenant context correctly before performing operations.

**13. How would you design tenant-level rate limiting at the API gateway?**
*Codebase Implementation:* Currently, the ERP only uses basic IP-based rate limiting (`rateLimit.middleware.ts`), which limits by connection rather than strictly by an authenticated tenant's quotas.

**14. How do you handle tenant data residency requirements (e.g., EU tenants must store data in EU regions)?**
*Codebase Implementation:* As a single-instance shared schema architecture, multi-region data residency is not currently supported natively by the application.

**15. How would you design a "tenant context" object that propagates through service calls, Kafka events, and async jobs?**
*Codebase Implementation:* The `tenant.middleware.ts` initializes the context in two ways: 
1. Mutating the Express `req` object (`req.organization`, `req.member`, `req.permissions`).
2. Persisting the tenant ID into `AsyncLocalStorage` via the `loggerContext.getStore().set("workspaceId", ...)` to ensure the context trickles down synchronously and into logs without prop-drilling.

**16. What are the challenges of running database migrations across thousands of tenant schemas?**
*Codebase Implementation:* This challenge is completely bypassed by the shared schema architecture. Prisma pushes one schema definition to a single database, applying to all tenants simultaneously.

**17. How would you design tenant-specific customizations (custom fields, custom workflows) without forking the codebase?**
*Codebase Implementation:* Currently, there is no advanced custom fields engine. Customizations are limited to whatever schema is supported within the `settings` JSON blob on the Organization record.

**18. How do you bill tenants accurately when usage is metered across multiple microservices?**
*Codebase Implementation:* The current source code does not include an integrated billing or metering service (e.g., Stripe integration).

**19. How would you architect a "trial tenant" lifecycle including auto-suspension and data retention after expiry?**
*Codebase Implementation:* There are no active lifecycle cron jobs or trial-tracking parameters embedded in the `Organization` schema. Status management is strictly manual.

**20. How do you design audit logging so logs are queryable per tenant but stored efficiently at scale?**
*Codebase Implementation:* Audit logs are heavily centralized via `audit.service.ts`. The methods (`recordIfContext` and `recordAuthEvent`) explicitly require an `organizationId`. Because the audit tables append the `organizationId` as an indexed column, queries scale linearly even as total logs increase across tenants.
