# Security Review
**Audit Phase 5 — Security Findings, Classification & Recommendations**
*Generated: 2026-06-17 | Auditor: Application Security Specialist*

---

## Executive Summary

The ERP has a solid security foundation for a startup-phase application: JWT with short-lived access tokens, CSRF protection, refresh token rotation, Redis-backed blacklisting, bcrypt password hashing, rate limiting, and input sanitization. However, several enterprise-grade security controls are absent: no MFA, no account lockout, production data committed to the repository, and tenant isolation enforced only at the application layer without database-level enforcement.

---

## Classification Key
- 🔴 **CRITICAL** — Exploitable, immediate remediation required
- 🟠 **HIGH** — Significant risk, remediate in next sprint
- 🟡 **MEDIUM** — Moderate risk, plan remediation
- 🟢 **LOW** — Minor risk, address in backlog
- ✅ **POSITIVE** — Security control correctly implemented

---

## 1. Authentication

### ✅ JWT Access + Refresh Token Architecture
**Evidence:**
```typescript
// auth.tokens.ts (referenced from auth.service.ts)
generateAccessToken(userId, { organizationId, membershipId, role })
generateRefreshToken(userId, sessionId)
```
Access tokens are short-lived (constant `ACCESS_TOKEN_EXPIRES_IN`). Refresh tokens use session IDs as `jti`. Token types are verified (`payload.type !== "access"`).

### ✅ Refresh Token Rotation
**Evidence — auth.service.ts lines 466-474:**
```typescript
await authRepository.revokeRefreshSession(payload.jti);
await deleteRefreshSessionCache(payload.jti);
// New session created
const { refreshToken: newRefreshToken, csrfToken: newCsrfToken } = await createSession(...);
```
Old session is revoked before issuing new one. This prevents refresh token replay.

### ✅ Refresh Token Reuse Detection
**Evidence — auth.service.ts line 232:**
```typescript
if (hashToken(refreshToken) !== cachedSession.refreshTokenHash) {
  throw new ApiError(401, "Refresh token reuse detected");
}
```

### ✅ Access Token Blacklisting on Logout
**Evidence — auth.service.ts lines 69-76:**
```typescript
const blacklistAccessToken = async (jti: string, exp?: number) => {
  await redisClient.set(`blacklist:${jti}`, "1", { EX: ttl });
};
```
Tokens are blacklisted in Redis with TTL matching remaining validity. Auth middleware checks blacklist on every request (line 34 of auth.middleware.ts).

### ✅ CSRF Protection on Refresh
**Evidence — auth.service.ts lines 235-241:**
```typescript
if (!csrfToken) { throw new ApiError(403, "CSRF token missing"); }
if (hashToken(csrfToken) !== cachedSession.csrfTokenHash) {
  throw new ApiError(403, "Invalid CSRF token");
}
```

### 🟠 HIGH: No MFA (Multi-Factor Authentication)
**Evidence:** No TOTP/SMS/OTP fields in `User` model. No MFA challenge flow in `auth.service.ts`.  
**Impact:** Account takeover via credential stuffing or phishing provides full access. For financial ERP, MFA is a mandatory control.  
**Recommendation:** Implement TOTP (RFC 6238) with QR code enrollment and backup codes.

### 🟠 HIGH: No Account Lockout After Failed Login Attempts
**Evidence:** `auth.service.ts` login function has no failed-attempt counter:
```typescript
login: async (payload, req) => {
  const user = await authRepository.findUserByEmail(payload.email);
  const isMatch = await comparePassword(payload.password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");  // ← no counter increment
  }
}
```
**Impact:** Unlimited brute-force password attempts.  
**Recommendation:** Add `failedLoginAttempts` and `lockoutUntil` fields to `User` model. Lock after 5 failures for 15 minutes.

### 🟡 MEDIUM: No Login Audit for Failed Attempts
**Evidence:** Failed logins do not generate an AuditLog entry. Successful logins do (line 343 in auth.service.ts).  
**Impact:** Security incidents cannot be investigated.  
**Recommendation:** Log failed login attempts with IP address to AuditLog.

---

## 2. Authorization

### ✅ Permission-Based RBAC
**Evidence — tenant.middleware.ts:**
```typescript
const permissions = await getCachedMemberPermissions(membership.id);
req.permissions = permissions;
```
```typescript
export const requirePermission = (...permissions: string[]) => {
  return (req, _res, next) => {
    if (!hasAllPermissions(req.permissions, permissions)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
  };
};
```
Permissions are loaded per-request and cached in Redis. The `requirePermission` middleware enforces fine-grained access.

### 🟠 HIGH: `/api/v1/demo` Route Has No Auth
**Evidence — app.ts line 132:**
```typescript
app.use("/api/v1/demo", demoRoutes);  // ← No authMiddleware applied
```
Demo routes are mounted without any authentication middleware. If demo data seeding can be triggered by unauthenticated users, it is a denial-of-service vector.  
**Recommendation:** Apply `authMiddleware` + `requireRole("admin")` to all demo routes.

### 🟡 MEDIUM: `/api/v1/banking` Is an Alias With No Auth Check
**Evidence — app.ts line 151:**
```typescript
app.use("/api/v1/banking", treasuryRoutes); // Temporary compatibility alias
```
This alias forwards to treasury routes. If the treasury routes have auth middleware, this is safe. If not, this is an alternate unprotected path.  
**Recommendation:** Remove the alias or ensure identical middleware chain. Add a comment with a ticket tracking removal.

### 🟡 MEDIUM: Governance Routes Lack User Context Validation
**Evidence — governance.controller.ts:**
```typescript
const userId = (req as any).user?.id || "SYSTEM";  // fallback to "SYSTEM"
```
If `req.user` is undefined (unauthenticated), the controller proceeds with `userId = "SYSTEM"` rather than rejecting the request.  
**Recommendation:** Always validate `req.user` presence and throw 401 before proceeding.

---

## 3. Tenant Isolation

### ✅ Tenant Middleware Enforces Membership
**Evidence — tenant.middleware.ts lines 50-82:**
```typescript
const membership = await prisma.organizationMember.findUnique({
  where: { organizationId_userId: { organizationId, userId: req.user.id } }
});
if (!membership) {
  return next(new ApiError(403, "You are not a member of this organization"));
}
```

### ✅ Cross-Organization Token Enforcement
**Evidence — tenant.middleware.ts lines 40-48:**
```typescript
if (options.enforceTokenOrganization !== false &&
    req.user.organizationId &&
    req.user.organizationId !== organizationId) {
  return next(new ApiError(403, "Switch workspaces before accessing this organization"));
}
```

### 🔴 CRITICAL: No Database-Level Row-Level Security
**Evidence:** No PostgreSQL RLS policies observed in schema or migration files.  
**Impact:** Any query that bypasses `organizationId` filtering — due to a bug, direct DB query, or Prisma extension — exposes all tenant data. A single programming error becomes a cross-tenant data breach.  
**Recommendation:** Enable PostgreSQL RLS on all tenant-scoped tables. Apply `organizationId = current_setting('app.organization_id')` policies as a defense-in-depth layer.

### 🟠 HIGH: `EmailLog` Has No Tenant Scope
**Evidence — schema.prisma.bak:**
```prisma
model EmailLog {
  id         String   @id
  recipient  String
  subject    String
  // ← NO organizationId
}
```
**Impact:** Email delivery records are not tenant-scoped, creating a potential cross-tenant information disclosure.

---

## 4. Data Security

### 🔴 CRITICAL: Production Invoice Data Committed to Repository
**Evidence:**
```
File: backend/invoice_backup.json (141,111 bytes)
```
A 141KB JSON file named `invoice_backup.json` is present in the `backend/` directory. Given its name and size, this very likely contains real customer invoice data.  
**Impact:** Data breach. Customer names, email addresses, invoice amounts, and potentially GST numbers are accessible to anyone with repository access.  
**Recommendation:**
1. Immediately audit the file contents.
2. If real data: rotate any secrets, notify affected customers, purge from git history using `git filter-repo` or BFG Repo Cleaner.
3. Add `*.json` backup file patterns to `.gitignore`.
4. Implement a git pre-commit hook to prevent large JSON files from being committed.

### ✅ Password Hashing with bcrypt
**Evidence — auth.service.ts line 268:**
```typescript
const passwordHash = await hashPassword(payload.password);
// lib/bcrypt.ts uses bcrypt library (salt rounds INFERRED to be 10-12)
```

### ✅ Input Sanitization
**Evidence — sanitize.middleware.ts:**
```typescript
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim();  // Null byte removal
  }
  // Recursive for arrays and objects
};
app.use(sanitizeMiddleware);  // Applied globally
```

### 🟡 MEDIUM: JSON Body Size Limit (10kb) May Be Too Restrictive
**Evidence — app.ts line 104:**
```typescript
app.use(express.json({ limit: "10kb" }));
```
Invoice creation with many line items or import operations may legitimately exceed 10kb. This could cause 413 errors.  
**Recommendation:** Evaluate actual maximum payload sizes. Use route-specific size limits for file upload routes.

### 🟡 MEDIUM: CORS Configuration Relies on Environment Variable Parsing
**Evidence — app.ts lines 95-102:**
```typescript
origin: env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : env.APP_URL,
```
If `CORS_ORIGIN` is misconfigured with extra spaces or empty values, origins may be inadvertently allowed or rejected.

---

## 5. Session Management

### ✅ Session IP and Device Tracking
**Evidence — auth.service.ts lines 148-158:**
```typescript
const { device, ipAddress } = getRequestMetadata(req);
await authRepository.createRefreshSession({
  id: sessionId, userId, device, ipAddress, expiresAt
});
```

### ✅ All Sessions Revoked on Password Reset
**Evidence — auth.service.ts lines 635-643:**
```typescript
const sessions = await authRepository.listActiveRefreshSessions(payload.sub);
await authRepository.revokeAllRefreshSessions(payload.sub);
const keys = sessions.map((session) => refreshSessionKey(session.id));
await redisClient.del(keys);
```

### 🟡 MEDIUM: Session Listing Endpoint Not Observed
Users cannot view their active sessions from the API. This is a security transparency requirement — users should be able to see where they're logged in and revoke sessions.

---

## 6. API Protection

### ✅ Rate Limiting Applied
**Evidence — app.ts line 108:**
```typescript
app.use("/api", apiRateLimiter);
```

### ✅ Helmet Applied (HTTP Security Headers)
**Evidence — app.ts line 93:**
```typescript
app.use(helmet());
```
Sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, etc.

### ✅ Idempotency Middleware on Financial Routes
**Evidence — app.ts lines 140-143:**
```typescript
app.use("/api/v1/inventory", idempotencyMiddleware, inventoryRoutes);
app.use("/api/v1/invoices", idempotencyMiddleware, invoiceRoutes);
app.use("/api/v1/payments", idempotencyMiddleware, paymentRoutes);
app.use("/api/v1/expenses", idempotencyMiddleware, expenseRoutes);
```

### 🟡 MEDIUM: Idempotency Falls Back Silently on Redis Failure
**Evidence — idempotency.middleware.ts lines 31-34:**
```typescript
} catch (error) {
  // If Redis fails, proceed without idempotency
  return next();
}
```
**Impact:** If Redis is unavailable, idempotency protection is silently disabled. A network blip during invoice creation could result in duplicate invoices.  
**Recommendation:** Log the Redis failure with high severity. Consider returning 503 for critical financial endpoints if idempotency store is unavailable.

### 🟡 MEDIUM: `/metrics` Endpoint Protection
**Evidence — app.ts lines 118-123:**
```typescript
app.get("/metrics", metricsAuth, async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});
```
`metricsAuth` middleware is applied. Implementation details of `metrics.middleware.ts` indicate basic auth or secret-based check.

### 🟢 LOW: `/health` Endpoint Is Unauthenticated
**Evidence — app.ts lines 125-127:**
```typescript
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
```
Health endpoint exposes no sensitive data — this is intentional and acceptable for load balancer health checks.

---

## 7. Infrastructure Security

### 🟡 MEDIUM: Multiple `.env` Files with Secrets Potentially in Repo
**Evidence:**
```
backend/.env          (3,520 bytes)
backend/.env.local    (719 bytes)
backend/.env.production (1,625 bytes)
```
`.env` files are present in the repository root directory. If these contain real secrets (DB passwords, JWT secrets, AWS keys), they represent credential exposure.  
**Recommendation:** Verify `.gitignore` excludes all `.env` files containing real credentials. Use `git secrets` or `trufflehog` to scan the repository history.

---

## 8. Security Findings Summary

| Severity | Finding | Count |
|---|---|---|
| 🔴 CRITICAL | Production data in repository | 1 |
| 🔴 CRITICAL | No database-level RLS | 1 |
| 🟠 HIGH | No MFA | 1 |
| 🟠 HIGH | No account lockout | 1 |
| 🟠 HIGH | Demo routes without auth | 1 |
| 🟠 HIGH | EmailLog missing tenant scope | 1 |
| 🟡 MEDIUM | Governance fallback to SYSTEM user | 1 |
| 🟡 MEDIUM | Idempotency silent Redis failure | 1 |
| 🟡 MEDIUM | No failed login audit | 1 |
| 🟡 MEDIUM | CORS configuration fragility | 1 |
| 🟡 MEDIUM | .env files in repository | 1 |
| 🟡 MEDIUM | No session listing for users | 1 |
| 🟢 LOW | Banking alias compatibility route | 1 |
| 🟢 LOW | JSON body limit may cause 413 | 1 |
