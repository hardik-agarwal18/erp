# HRMS – Leaves Module

**Location:** `src/domains/hrms/leaves/`

Manages employee leave applications. Employees apply for leave, which is submitted through the Approval Engine. On approval, leave balance is atomically deducted and future attendance records are marked `ON_LEAVE`.

---

## Files

| File | Purpose |
|---|---|
| `leaves.service.ts` | Leave application CRUD, submit, approve (via event), list |
| `leaves.controller.ts` | HTTP handling |
| `leaves.routes.ts` | Route definitions |
| `leaves.repository.ts` | Data access for `LeaveApplication`, `LeaveBalance`, `LeaveType` |
| `leaves.types.ts` | TypeScript interfaces |
| `leaves.validators.ts` | Zod schemas |

---

## Routes

All routes are mounted at `/api/v1/leaves`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/leaves` | ✅ | – | Apply for leave (creates DRAFT) |
| `GET` | `/leaves` | ✅ | – | List leave applications |
| `GET` | `/leaves/:id` | ✅ | – | Get a single application |
| `POST` | `/leaves/:id/submit` | ✅ | – | Submit DRAFT for approval |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`leaves.types.ts`)

### `ApplyForLeaveInput`
```typescript
{
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;   // ISO date
  toDate: string;     // ISO date
  totalDays: number;
  reason?: string;
}
```

---

## Service Functions (`leaves.service.ts`)

### `leavesService.applyForLeave(organizationId, payload)`
1. Fetches `LeaveBalance` for the employee + leave type.
2. Validates `balance.remaining >= payload.totalDays`. Throws `400 "Insufficient leave balance"` if not.
3. Creates `LeaveApplication` in `DRAFT` status.

### `leavesService.submitForApproval(organizationId, id, userId)`
1. Validates application exists and is in `DRAFT` status.
2. Calls `approvalsService.submitForApproval()` with `entityType: "LEAVE_APPLICATION"`.
3. Updates application status to `PENDING_APPROVAL`.

### `leavesService.approveLeave(organizationId, applicationId)`
Called automatically by the EventBus when `approval.completed` fires for `entityType === "LEAVE_APPLICATION"`:
1. **Inside `prisma.$transaction`**:
   - Deducts `totalDays` from `LeaveBalance.remaining`, increments `LeaveBalance.used`.
   - Sets `LeaveApplication.status = APPROVED`.
   - Iterates each date from `fromDate` to `toDate`:
     - If `AttendanceRecord` exists for the date → updates `status = ON_LEAVE`.
     - If not → creates new `AttendanceRecord` with `status = ON_LEAVE`.
2. Emits `leave.approved` event.

### `leavesService.listApplications(organizationId, employeeId?)`
Returns all applications, optionally filtered by `employeeId`.

---

## Event Integration

| Event Listened | Source | Action |
|---|---|---|
| `approval.completed` (entityType: `LEAVE_APPLICATION`) | Approvals Engine | Calls `approveLeave()` |
| `approval.rejected` (entityType: `LEAVE_APPLICATION`) | Approvals Engine | Sets application `status = REJECTED` |

| Event Emitted | When |
|---|---|
| `leave.approved` | After balance deducted and attendance marked |
| `leave.rejected` | After rejection processed |

---

## Leave Application Lifecycle

```
applyForLeave()  → DRAFT
submitForApproval() → PENDING_APPROVAL
  ↓ (Approval Engine)
APPROVED → balance deducted + attendance marked ON_LEAVE
REJECTED → no balance change
```
