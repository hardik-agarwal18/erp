# Auth Module

**Location:** `src/modules/auth/`

Handles user registration, login, logout, session management, email verification, password reset, profile updates, and email change workflows.

---

## Files

| File | Purpose |
|---|---|
| `auth.service.ts` | Core authentication business logic (705 lines) |
| `auth.controller.ts` | HTTP request/response handling |
| `auth.routes.ts` | Express route definitions |
| `auth.repository.ts` | Prisma data access for users, sessions, tokens |
| `auth.tokens.ts` | JWT generation and verification functions |
| `auth.types.ts` | TypeScript interfaces for token payloads |
| `auth.validators.ts` | Zod schemas for request validation |
| `auth.utils.ts` | Utility functions (hash, URL builders, metadata) |
| `auth.constants.ts` | Token expiration values and cookie names |
| `auth.middleware.ts` | Module-specific middleware (refresh token check) |
| `email-change.service.ts` | Dual-OTP email change workflow |

---

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/signup` | ❌ | Alias for register |
| `POST` | `/auth/login` | ❌ | Login with email/password |
| `POST` | `/auth/logout` | ✅ | Logout current session |
| `POST` | `/auth/logout-all` | ✅ | Logout all sessions |
| `POST` | `/auth/refresh` | 🔄 | Refresh access token (uses cookie) |
| `POST` | `/auth/switch-workspace` | ✅🔄 | Switch active organization |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset email |
| `POST` | `/auth/reset-password` | ❌ | Reset password with token |
| `GET` | `/auth/verify-email` | ❌ | Verify email address |
| `POST` | `/auth/resend-verification` | ❌ | Resend verification email |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `PATCH` | `/auth/me` | ✅ | Update profile (name only) |
| `POST` | `/auth/email-change/request` | ✅ | Request email change (sends dual OTPs) |
| `POST` | `/auth/email-change/verify` | ✅ | Verify email change with both OTPs |

Legend: ✅ = `authMiddleware`, 🔄 = `requireRefreshToken`

---

## Constants (`auth.constants.ts`)

| Constant | Value | Description |
|---|---|---|
| `ACCESS_TOKEN_EXPIRES_IN` | `900` (15 min) | Access token TTL in seconds |
| `REFRESH_TOKEN_EXPIRES_IN` | `604800` (7 days) | Refresh token TTL in seconds |
| `EMAIL_VERIFY_TOKEN_EXPIRES_IN` | `86400` (24 hours) | Email verification token TTL |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | `3600` (1 hour) | Password reset token TTL |
| `REFRESH_COOKIE_NAME` | `"refreshToken"` | Cookie name for refresh token |
| `CSRF_COOKIE_NAME` | `"csrfToken"` | Cookie name for CSRF token |

---

## Types (`auth.types.ts`)

### `AccessTokenPayload`
```typescript
{
  sub: string;         // User ID
  jti: string;         // Token ID (for blacklisting)
  type: "access";
  organizationId?: string;
  membershipId?: string;
  role?: string;
  exp?: number;
}
```

### `RefreshTokenPayload`
```typescript
{
  sub: string;         // User ID
  jti: string;         // Session ID
  type: "refresh";
  exp?: number;
}
```

### `EmailTokenPayload`
```typescript
{ sub: string; jti: string; type: "email_verify"; }
```

### `PasswordTokenPayload`
```typescript
{ sub: string; jti: string; type: "password_reset"; }
```

### `AuthContext`
```typescript
{
  userId: string;
  organizationId?: string | null;
  membershipId?: string | null;
  role?: string | null;
}
```

---

## Validators (`auth.validators.ts`)

| Schema | Validates |
|---|---|
| `registerSchema` | `body: { name: min 2, email: valid, password: 8-128 chars }` |
| `loginSchema` | `body: { email, password }` |
| `switchWorkspaceSchema` | `body: { organizationId: UUID }` |
| `refreshTokenSchema` | `headers: { x-csrf-token: min 1 }` |
| `forgotPasswordSchema` | `body: { email }` |
| `resetPasswordSchema` | `body: { token: min 10, password: 8-128 }` |
| `verifyEmailSchema` | `query: { token: min 10 }` |
| `resendVerificationSchema` | `body: { email }` |
| `updateProfileSchema` | `body: { name: 2-100, email }` |
| `requestEmailChangeSchema` | `body: { newEmail }` |
| `verifyEmailChangeSchema` | `body: { currentEmailOtp: 6 digits, newEmailOtp: 6 digits }` |

---

## Service Functions (`auth.service.ts`)

### `authService.register(payload)`
Registers a new user account.
1. Checks for duplicate email → `409 Conflict`
2. Hashes password (bcrypt, 12 rounds)
3. Creates user record via `authRepository.createUser()`
4. Generates email verification token (JWT with `email_verify` type)
5. Stores verification token in DB with 24h expiry
6. Sends verification email via mail service
7. Records `AUTH_REGISTER` audit event
8. Returns the created user

### `authService.login(payload, req)`
Authenticates a user and creates a session.
1. Finds user by email → `401` if not found
2. Compares password → `401` if mismatch
3. Checks `isVerified` → `403` if not verified
4. Fetches user's organization memberships
5. Selects first membership as active workspace
6. Generates access token (JWT) with org/role claims
7. Creates refresh session (DB + Redis cache)
8. Generates CSRF token
9. Records `AUTH_LOGIN` audit event
10. Returns `{ user, accessToken, refreshToken, csrfToken, organizations, activeOrganization }`

### `authService.logout(userId, refreshToken?, auth?, organizationId?)`
Logs out the current session.
1. Blacklists access token in Redis (TTL = remaining expiry)
2. If refresh token provided: verifies, revokes DB session, deletes Redis cache
3. Records `AUTH_LOGOUT` audit event

### `authService.logoutAll(userId, auth?, organizationId?)`
Revokes all active sessions for a user.
1. Blacklists current access token
2. Lists all active refresh sessions from DB
3. Revokes all sessions (bulk `updateMany`)
4. Deletes all Redis session caches
5. Records `AUTH_LOGOUT_ALL` audit event

### `authService.refresh(refreshToken, csrfToken, req)`
Rotates refresh token and issues new access token.
1. Verifies refresh token JWT
2. Validates CSRF token (double-submit pattern)
3. Checks Redis cache for session data
4. Cross-validates session in DB (not revoked, not expired)
5. Revokes old session (both DB and Redis)
6. Creates new session with fresh tokens
7. Returns `{ accessToken, refreshToken, csrfToken }`

**Security:** Implements refresh token rotation – the old token is invalidated immediately.

### `authService.switchWorkspace(userId, organizationId, refreshToken, csrfToken)`
Switches the user's active organization context.
1. Verifies refresh session (JWT + CSRF + Redis + DB)
2. Resolves access context (membership + role) for the target org → `403` if not member
3. Updates session's active organization in DB + Redis
4. Generates new access token with updated org/role claims
5. Returns `{ accessToken, activeOrganization, organizations }`

### `authService.verifyEmail(token)`
Verifies a user's email address.
1. Verifies email verification JWT
2. Looks up stored token in DB → `400` if not found or user mismatch
3. Checks expiry → `400` if expired (deletes token)
4. Marks user as verified
5. Deletes verification token

### `authService.resendVerification(email)`
Resends the verification email.
1. Finds user by email (silently returns if not found or already verified)
2. Checks for existing valid token → reuses if found
3. Otherwise creates new token
4. Sends verification email

### `authService.forgotPassword(email)`
Initiates password reset flow.
1. Finds user by email (silently returns if not found – prevents enumeration)
2. Generates password reset token (JWT with `password_reset` type)
3. Stores reset token with 1h expiry
4. Sends password reset email

### `authService.resetPassword(token, password)`
Resets user password using reset token.
1. Verifies reset token JWT
2. Validates against DB stored token
3. Checks expiry
4. Hashes new password
5. Updates user password
6. **Revokes ALL active sessions** (forces re-login everywhere)

### `authService.updateProfile(userId, data)`
Updates user profile information.
1. Finds user → `404`
2. If email changed: checks for conflicts → `409`, sets `isVerified = false`
3. Updates user record
4. If email changed: triggers verification email for new address
5. Returns updated user info

### `authService.getMe(userId, activeOrganizationId?)`
Returns current user profile with all workspace memberships.

---

## Token Functions (`auth.tokens.ts`)

| Function | Token Type | Secret | Expiry |
|---|---|---|---|
| `generateAccessToken(userId, context?)` | `access` | `JWT_ACCESS_SECRET` | 15 min |
| `generateRefreshToken(userId, sessionId)` | `refresh` | `JWT_REFRESH_SECRET` | 7 days |
| `generateEmailVerificationToken(userId, tokenId)` | `email_verify` | `EMAIL_VERIFY_SECRET` | 24 hours |
| `generatePasswordResetToken(userId, tokenId)` | `password_reset` | `PASSWORD_RESET_SECRET` | 1 hour |
| `verifyAccessToken(token)` | Verifies `access` type | `JWT_ACCESS_SECRET` | — |
| `verifyRefreshToken(token)` | Verifies `refresh` type | `JWT_REFRESH_SECRET` | — |

---

## Utility Functions (`auth.utils.ts`)

| Function | Description |
|---|---|
| `hashToken(token)` | SHA-256 hash (for storing refresh/CSRF tokens) |
| `getRequestMetadata(req)` | Extracts `user-agent` and `ip` from request |
| `buildVerificationUrl(token)` | `{APP_URL}/api/v1/auth/verify-email?token={token}` |
| `buildPasswordResetUrl(token)` | `{APP_URL}/reset-password?token={token}` |
| `buildInvitationUrl(token)` | `{APP_URL}/accept-invitation?token={token}` |

---

## Auth Module Middleware (`auth.middleware.ts`)

### `requireRefreshToken(req, res, next)`
Validates that:
1. `refreshToken` cookie is present → `401` if missing
2. `x-csrf-token` header is present → `403` if missing

Used on `/refresh` and `/switch-workspace` routes.

---

## Email Change Service (`email-change.service.ts`)

Implements a **dual-OTP** email change workflow for security.

### `emailChangeService.requestEmailChange(userId, newEmail)`
1. Validates user exists → `404`
2. Checks new email differs from current → `400`
3. Checks new email not in use → `409`
4. Generates two 6-digit OTPs (one for current email, one for new)
5. Stores in Redis with 10-minute TTL
6. Sends OTP to current email (security alert)
7. Sends OTP to new email (verification)

### `emailChangeService.verifyEmailChange(userId, currentEmailOtp, newEmailOtp)`
1. Retrieves stored OTPs from Redis → `400` if expired
2. Validates both OTPs match → `400` if mismatch
3. Re-checks new email availability → `409`
4. Updates user email and marks as verified (OTP proves ownership)
5. Cleans up Redis
6. Records `AUTH_EMAIL_CHANGED` audit event

---

## Repository Functions (`auth.repository.ts`)

### User Operations
| Function | Description |
|---|---|
| `findUserByEmail(email)` | Find user by email |
| `findUserById(id)` | Find user by ID |
| `createUser(data)` | Create new user `{ name, email, password }` |
| `updateUser(userId, data)` | Update user `{ name?, email?, isVerified? }` |
| `updateUserPassword(userId, password)` | Update password hash |
| `markUserVerified(userId)` | Set `isVerified = true` |

### Membership Operations
| Function | Description |
|---|---|
| `listUserMemberships(userId)` | List all org memberships with role and org details |
| `findMembership(userId, orgId)` | Find specific membership |

### Session Operations
| Function | Description |
|---|---|
| `createRefreshSession(data)` | Create new session record |
| `findRefreshSession(id)` | Find session by ID |
| `revokeRefreshSession(id)` | Set `revokedAt` on session |
| `revokeAllRefreshSessions(userId)` | Revoke all active sessions for user |
| `listActiveRefreshSessions(userId)` | List non-revoked sessions |
| `updateRefreshSessionOrganization(id, orgId)` | Update active org on session |

### Token Operations
| Function | Description |
|---|---|
| `createEmailVerificationToken(data)` | Store email verification token |
| `findEmailVerificationToken(token)` | Look up verification token |
| `deleteEmailVerificationToken(token)` | Remove verification token |
| `findValidEmailVerificationTokenForUser(userId)` | Find non-expired token |
| `deleteEmailVerificationTokensForUser(userId)` | Remove all tokens for user |
| `createPasswordResetToken(data)` | Store password reset token |
| `findPasswordResetToken(token)` | Look up reset token |
| `deletePasswordResetToken(token)` | Remove reset token |
| `deletePasswordResetTokensForUser(userId)` | Remove all reset tokens |

---

## Controller Functions (`auth.controller.ts`)

Each controller function maps 1:1 with a route, handling:
1. Extracting parameters from `req.body`, `req.params`, `req.query`, `req.cookies`, `req.headers`
2. Calling the corresponding service function
3. Setting cookies (login/refresh/logout)
4. Returning standardized response via `sendSuccess()`

| Function | Key Behavior |
|---|---|
| `register` | Returns 201, message only (no data) |
| `login` | Sets auth cookies, returns user + tokens + orgs |
| `logout` | Clears auth cookies |
| `logoutAll` | Clears auth cookies |
| `refresh` | Sets new auth cookies, returns new access token |
| `switchWorkspace` | Returns new access token + workspace data |
| `verifyEmail` | Returns success message |
| `resendVerification` | Returns generic message (prevents enumeration) |
| `forgotPassword` | Returns generic message (prevents enumeration) |
| `resetPassword` | Returns success message |
| `updateProfile` | Returns updated user data |
| `requestEmailChange` | Returns instructions message |
| `verifyEmailChange` | Returns updated user data |
| `getMe` | Returns full user profile with orgs |
