# Approvals Module

**Location:** `src/domains/core/approvals/`

A generic, configurable multi-step approval workflow engine. Any module can submit an entity for approval by referencing an `ApprovalTemplate`. The engine tracks the current step, records approver actions, and emits domain events (via EventBus) when the outcome is reached. Other modules listen to these events to update their own state.

---

## Files

| File | Purpose |
|---|---|
| `approvals.service.ts` | Workflow logic (template CRUD, submit, approve, reject, cancel) |
| `approvals.controller.ts` | HTTP handling |
| `approvals.routes.ts` | Route definitions |
| `approvals.repository.ts` | Data access for `ApprovalTemplate`, `ApprovalInstance`, `ApprovalAction` |
| `approvals.types.ts` | TypeScript interfaces |
| `approvals.validators.ts` | Zod schemas |

---

## Routes

All routes are mounted at `/api/v1/approvals`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/approvals/me/pending` | ✅ | – | Fetch all pending approvals actionable by the current user |
| `GET` | `/approvals/:entityType/:entityId/history` | ✅ | – | Get approval history for a specific entity |
| `POST` | `/approvals/templates` | ✅ | `SETTINGS_MANAGE` | Create an approval template |
| `POST` | `/approvals/:id/approve` | ✅ | – | Approve the current step |
| `POST` | `/approvals/:id/reject` | ✅ | – | Reject the current step |
| `POST` | `/approvals/:id/cancel` | ✅ | – | Cancel a pending approval (submitter only) |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`approvals.types.ts`)

### `CreateApprovalTemplateInput`
```typescript
{
  entityType: string;    // e.g. "PAYROLL_RUN", "LEAVE_APPLICATION", "ATTENDANCE_ADJUSTMENT"
  name: string;
  steps: Array<{
    order: number;
    approverType: "USER" | "ROLE";
    userId?: string;     // Required if approverType = USER
    roleId?: string;     // Required if approverType = ROLE
    label?: string;
  }>;
}
```

### `ActionApprovalInput`
```typescript
{
  comments?: string;
}
```

---

## Service Functions (`approvals.service.ts`)

### `approvalsService.createTemplate(organizationId, payload)`
Creates a multi-step approval template for a given `entityType`.
- Steps are sorted by `order` and normalized to sequential 1,2,3...
- One active template per `entityType` per organization (enforced at repo level).

### `approvalsService.getTemplate(organizationId, entityType)`
Fetches the active template for a given entity type.

### `approvalsService.submitForApproval(organizationId, entityType, entityId, submittedById)`
Initiates an approval flow:
1. Fetches active template for `entityType`. Throws `404` if none found.
2. Validates template `isActive: true` and has steps.
3. Checks for existing `PENDING` instance → throws `400` if already pending.
4. Creates `ApprovalInstance` starting at `currentStepOrder = 1`.

### `approvalsService.approve(organizationId, instanceId, actorId, payload?)`
Processes an approval action:
1. Validates instance is `PENDING`.
2. Records action (`APPROVE`) with optional `comments`.
3. If current step is the **last step**: sets `status = APPROVED` and emits `approval.completed` event.
4. Otherwise: advances `currentStepOrder` to `order + 1` (next approver).

### `approvalsService.reject(organizationId, instanceId, actorId, payload?)`
Records a `REJECT` action, sets `status = REJECTED`, emits `approval.rejected` event.

### `approvalsService.cancel(organizationId, instanceId, actorId)`
Only the original submitter can cancel. Sets `status = CANCELLED`.

### `approvalsService.getPendingApprovals(organizationId, userId)`
Returns all `PENDING` instances where the current step's `approverType` matches the user's ID or role:
- `approverType === "USER"` and `step.userId === userId`
- `approverType === "ROLE"` and `step.roleId` is in the user's roles

### `approvalsService.getApprovalHistory(organizationId, entityType, entityId)`
Returns all approval instances and their actions for a given entity.

---

## Event-Driven Integration

The Approvals Engine uses the in-process `EventBus` (`src/shared/events/event-bus.ts`) to decouple the approval decision from business consequences:

### Emitted Events

| Event | Payload | When |
|---|---|---|
| `approval.completed` | `{ organizationId, entityType, entityId, approvalInstanceId, approvedBy, approvedAt }` | All steps approved |
| `approval.rejected` | `{ organizationId, entityType, entityId, approvalInstanceId, rejectedBy, rejectedAt }` | Any step rejected |

### Module Listeners

| Module | EntityType | On `approval.completed` | On `approval.rejected` |
|---|---|---|---|
| **Payroll** | `PAYROLL_RUN` | Sets run `status = APPROVED`, emits `payroll.processed` | Sets run `status = CANCELLED` |
| **Leaves** | `LEAVE_APPLICATION` | Calls `leavesService.approveLeave()` – deducts balance & marks attendance | Sets application `status = REJECTED` |
| **Attendance** | `ATTENDANCE_ADJUSTMENT` | Calls `attendanceService.applyAdjustment()` | _(no action needed)_ |

---

## Approval Lifecycle

```
[Module submits] → PENDING (Step 1)
                        ↓ approve
                   PENDING (Step 2) → ... → APPROVED (all steps done)
                        ↓ reject at any step
                     REJECTED
                        ↓ cancel (by submitter)
                     CANCELLED
```
