# Organizations Module

**Location:** `src/modules/organizations/`

Manages multi-tenant organizations, member management, invitation workflows, join requests, and ownership transfer.

---

## Files

| File | Purpose |
|---|---|
| `organization.service.ts` | Organization business logic (701 lines) |
| `organization.controller.ts` | HTTP request/response handling |
| `organization.routes.ts` | Route definitions with permission guards |
| `organization.repository.ts` | Data access for orgs, members, roles, invitations |
| `organization.types.ts` | TypeScript interfaces |
| `organization.validators.ts` | Zod request schemas |
| `organization.middleware.ts` | Organization context middleware |
| `join-request.service.ts` | Join request business logic |
| `join-request.controller.ts` | Join request HTTP handling |
| `join-request.validators.ts` | Join request Zod schemas |

---

## Routes

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/organizations` | Auth only | Create organization |
| `GET` | `/organizations` | Auth only | List user's organizations |
| `POST` | `/organizations/join` | Auth only | Request to join org |
| `GET` | `/organizations/:id` | `organization.view` | Get organization details |
| `PATCH` | `/organizations/:id` | `organization.update` | Update organization |
| `DELETE` | `/organizations/:id` | `owner` + `organization.delete` | Delete organization |
| `GET` | `/organizations/:id/members` | `member.view` | List members |
| `GET` | `/organizations/:id/audit-logs` | `audit.read` | List audit logs |
| `POST` | `/organizations/:id/members/invite` | `member.invite` | Invite member |
| `PATCH` | `/organizations/:id/members/:memberId` | `member.update` | Update member role |
| `DELETE` | `/organizations/:id/members/:memberId` | `member.remove` | Remove member |
| `POST` | `/organizations/:id/leave` | Auth + org context | Leave organization |
| `POST` | `/organizations/:id/transfer-ownership` | `owner` + `ownership.transfer` | Transfer ownership |
| `GET` | `/organizations/:id/join-requests` | `owner`/`admin` | List pending join requests |
| `POST` | `/organizations/:id/join-requests/:requestId/approve` | `owner`/`admin` | Approve join request |
| `POST` | `/organizations/:id/join-requests/:requestId/reject` | `owner`/`admin` | Reject join request |

---

## Types (`organization.types.ts`)

### `CreateOrganizationInput`
```typescript
{
  name: string;
  slug?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  invites?: string[];   // Email addresses to invite during creation
}
```

### `UpdateOrganizationInput`
```typescript
{
  name?: string;
  slug?: string;
  logo?: string | null;
  settings?: Record<string, unknown>;
}
```

### `InviteMemberInput`
```typescript
{
  email: string;
  roleId?: string;      // Specify role by ID
  roleName?: string;    // OR by name
}
```

---

## Service Functions (`organization.service.ts`)

### Internal Helpers

#### `buildUniqueSlug(candidate: string): string`
Generates a unique URL slug from the organization name. Appends numeric suffix if slug exists.

#### `createSystemAuthorization(tx, organizationId)`
Creates the full RBAC authorization setup for a new organization:
1. Creates all permissions from `DEFAULT_PERMISSIONS`
2. Creates 4 system roles: `owner`, `admin`, `manager`, `member`
3. Assigns permissions to each role per the RBAC matrix

#### `resolveAssignableRole(organizationId, roleId?, roleName?)`
Resolves a role by ID or name. Rejects `owner` role assignment (requires ownership transfer).

#### `assertOwner(ownerId, actorUserId)`
Throws `403` if the actor is not the organization owner.

---

### `organizationService.createOrganization(userId, payload)`
Creates a new organization with full setup.
1. Generates unique slug
2. Generates join code (4-char prefix + 6-char hex)
3. **In single transaction:**
   - Creates organization record
   - Creates system roles + permissions
   - Creates owner membership (creator → owner role)
   - Records `ORGANIZATION_CREATED` audit event
4. Post-transaction: sends invitation emails to `payload.invites[]` (fire-and-forget)
5. Returns organization with membership info

### `organizationService.listOrganizations(userId)`
Returns all organizations the user is a member of, with role info.

### `organizationService.getOrganization(organizationId)`
Returns organization by ID → `404` if not found.

### `organizationService.updateOrganization(organizationId, actorUserId, payload)`
Updates organization details.
- Validates unique slug if changed → `409` on conflict
- Settings changes restricted to owner → `403`
- Records `ORGANIZATION_UPDATED` audit event

### `organizationService.deleteOrganization(organizationId, actorUserId)`
Hard-deletes organization. Owner only.

### `organizationService.listMembers(organizationId)`
Lists all members with user details and role info, ordered by join date.

### `organizationService.inviteMember(organizationId, actorUserId, payload)`
Invites a user to join the organization.
1. Validates organization exists
2. Normalizes email (trim + lowercase)
3. Checks if user already a member → `409`
4. Resolves role (rejects `owner`) → `404` if not found
5. Checks for active pending invitation → `409`
6. Creates invitation record with 24h expiry
7. Caches in Redis for quick lookup
8. Records `INVITATION_SENT` audit event
9. Sends invitation email via mail service
10. Returns invitation record

### `organizationService.updateMemberRole(organizationId, memberId, actorUserId, actorRoleName, roleId)`
Changes a member's role.
- Cannot change `owner` role (use ownership transfer)
- Only owner can change admin roles
- Only owner can assign `admin`/`manager` roles
- Clears permission cache after update
- Records `ORGANIZATION_MEMBER_ROLE_UPDATED` audit event

### `organizationService.removeMember(organizationId, memberId, actorUserId, actorRoleName)`
Removes a member from the organization.
- Cannot remove self (use leave)
- Cannot remove owner
- Only owner can remove admins
- Clears permission cache
- Records `ORGANIZATION_MEMBER_REMOVED` audit event

### `organizationService.leaveOrganization(organizationId, userId)`
Allows a member to leave voluntarily.
- Owner must transfer ownership first → `400`
- Clears permission cache
- Records `ORGANIZATION_LEFT` audit event

### `organizationService.transferOwnership(organizationId, actorUserId, targetMemberId)`
Transfers ownership to another member.
1. Verifies actor is owner
2. **In transaction:**
   - Updates `organization.ownerId`
   - Assigns `owner` role to target
   - Demotes current owner to `admin`
   - Records audit event
3. Clears permission caches for both members

### `organizationService.acceptInvitation(token, password?, name?)`
Accepts an organization invitation.
1. Checks Redis blacklist (prevents reuse)
2. Finds invitation by token → `404`
3. Checks expiry → `400`
4. Rejects `owner` role invitations → `400`
5. Looks up invitee user by email
6. If user doesn't exist: requires `name` + `password`, creates account, auto-verifies
7. Checks for existing membership → `409`
8. **In transaction:**
   - Creates membership
   - Marks invitation as accepted
   - Records `INVITATION_ACCEPTED` audit event
9. Blacklists token in Redis
10. Returns `{ organizationId, organizationName, userId, membershipId, role }`

---

## Join Request Service (`join-request.service.ts`)

### `joinRequestService.createJoinRequest(userId, joinCode, message?)`
Creates a request to join an organization.
1. Looks up organization by join code **or** UUID
2. Checks if already a member → `409`
3. Checks for existing pending request → `409`
4. Checks for active invitation → `409` (tells user to check email)
5. Upserts join request (allows re-requesting after rejection)
6. Records `JOIN_REQUEST_CREATED` audit event

### `joinRequestService.listJoinRequests(organizationId)`
Lists all pending join requests with user info, ordered newest first.

### `joinRequestService.approveJoinRequest(organizationId, requestId, actorUserId)`
Approves a pending join request.
1. Validates request exists and is pending
2. Resolves `member` role for the organization
3. **In transaction:**
   - Updates request status to `ACCEPTED`
   - Creates membership with `member` role
   - Records `JOIN_REQUEST_APPROVED` audit event

### `joinRequestService.rejectJoinRequest(organizationId, requestId, actorUserId)`
Rejects a pending join request.
1. Validates request exists and is pending
2. **In transaction:**
   - Updates status to `REJECTED`
   - Records `JOIN_REQUEST_REJECTED` audit event

---

## Repository Functions (`organization.repository.ts`)

### Organization Queries
| Function | Description |
|---|---|
| `findById(id)` | Find org by ID |
| `findBySlug(slug)` | Find org by URL slug |
| `listForUser(userId)` | List orgs where user is member |

### Member Queries
| Function | Description |
|---|---|
| `listMembers(organizationId)` | List members with user/role details |
| `findMemberById(id)` | Find member by membership ID |
| `findMemberByUserId(orgId, userId)` | Find by composite key |

### Role Queries
| Function | Description |
|---|---|
| `findRoleById(orgId, roleId)` | Find role with permissions |
| `findRoleByName(orgId, name)` | Find role by name (case-insensitive) |

### Invitation Queries
| Function | Description |
|---|---|
| `findInvitationByEmail(orgId, email)` | Find pending invitation by email |
| `findInvitationByToken(token)` | Find invitation by token (includes role + org) |
| `listInvitations(orgId)` | List pending invitations |

---

## Validators (`organization.validators.ts`)

| Schema | Validates |
|---|---|
| `organizationIdParamSchema` | `params.id: UUID` |
| `organizationMemberParamsSchema` | `params: { id: UUID, memberId: UUID }` |
| `createOrganizationSchema` | `body: { name: 2-120, slug?: 2-120, logo?: URL, settings?: Record, invites?: email[] }` |
| `updateOrganizationSchema` | `params.id + body: { name?, slug?, logo? (nullable), settings? }` |
| `inviteMemberSchema` | `params.id + body: { email, roleId? OR roleName? }` (requires at least one) |
| `updateMemberSchema` | `params: { id, memberId } + body: { roleId: UUID }` |
| `transferOwnershipSchema` | `params.id + body: { memberId: UUID }` |
| `createJoinRequestSchema` | `body: { joinCode: min 1, message?: max 500 }` |
| `joinRequestIdParamSchema` | `params: { id: UUID, requestId: UUID }` |
