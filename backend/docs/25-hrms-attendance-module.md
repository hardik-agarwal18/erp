# HRMS – Attendance Module

**Location:** `src/domains/hrms/attendance/`

Manages employee daily attendance records: check-in, check-out, late detection, half-day classification, adjustments (with optional approval workflow), and period locking. Provides a payroll summary consumed by the Payroll module during payroll generation.

---

## Files

| File | Purpose |
|---|---|
| `attendance.service.ts` | Check-in/out, adjustments, payroll summary, period management |
| `attendance.controller.ts` | HTTP handling |
| `attendance.routes.ts` | Route definitions |
| `attendance.repository.ts` | Data access for `AttendanceRecord`, `AttendanceAdjustment`, `AttendancePolicy`, `AttendancePeriod`, `EmployeeShiftAssignment` |
| `attendance.types.ts` | TypeScript interfaces |
| `attendance.validators.ts` | Zod schemas |

---

## Routes

All routes are mounted at `/api/v1/attendance`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/attendance/check-in` | ✅ | – | Record employee check-in |
| `POST` | `/attendance/check-out` | ✅ | – | Record employee check-out |
| `POST` | `/attendance/adjust` | ✅ | `ATTENDANCE_MANAGE` | Request attendance adjustment |
| `GET` | `/attendance/summary` | ✅ | `ATTENDANCE_READ` | Get payroll summary for month/employee |

Legend: ✅ = `authMiddleware` + `tenantContextMiddleware`

---

## Types (`attendance.types.ts`)

### `CheckInInput`
```typescript
{
  employeeId: string;
  time?: string;    // ISO datetime; defaults to now()
  notes?: string;
}
```

### `CheckOutInput`
```typescript
{
  employeeId: string;
  time?: string;    // ISO datetime; defaults to now()
  notes?: string;
}
```

### `RequestAdjustmentInput`
```typescript
{
  employeeId: string;
  date: string;
  newStatus?: AttendanceStatus;
  newCheckIn?: string;
  newCheckOut?: string;
  reason: string;
}
```

### `PayrollSummary`
```typescript
{
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  unpaidDays: number;
  halfDays: number;
  lateDays: number;
  overtimeHours: number;
}
```

---

## Service Functions (`attendance.service.ts`)

### `attendanceService.checkIn(organizationId, payload)`
1. Validates attendance period is `OPEN` via `ensurePeriodOpen`.
2. Throws `400` if employee already checked in today.
3. Fetches `AttendancePolicy` and active `EmployeeShiftAssignment` for the date.
4. **Late detection**: If shift is assigned, compares check-in time to `shift.startTime + lateGraceMinutes`. Sets status to `LATE` if overdue.
5. Creates or updates `AttendanceRecord`.
6. Emits `attendance.checked-in` event.

### `attendanceService.checkOut(organizationId, payload)`
1. Validates period is `OPEN`.
2. Throws `400` if not checked in, or already checked out.
3. Calculates `workedMinutes` from check-in to check-out time.
4. **Status reclassification** based on `AttendancePolicy`:
   - `workedMinutes < halfDayMinutes` (default 240 min / 4 hrs) → `ABSENT`
   - `workedMinutes < fullDayMinutes` (default 480 min / 8 hrs) → `HALF_DAY`
   - Otherwise: keeps existing status (PRESENT or LATE).
5. Updates `AttendanceRecord` with `checkOut`, `workedMinutes`, and final status.
6. Emits `attendance.checked-out` event.

### `attendanceService.requestAdjustment(organizationId, actorUserId, hasAdjustPermission, payload)`
Handles both minor and major corrections:
1. Validates period is `OPEN`.
2. Creates an `AttendanceAdjustment` record.
3. **Minor adjustment** (< 2 hr difference in worked time) AND actor has `ATTENDANCE_MANAGE` permission:
   - Directly approves and applies the adjustment via `applyAdjustment()`.
   - Returns `{ adjustment, status: "APPROVED" }`.
4. **Major adjustment** or no permission:
   - Submits to Approval Engine (requires `ATTENDANCE_ADJUSTMENT` template).
   - Returns `{ adjustment, status: "PENDING_APPROVAL" }`.

> The Approval Engine emits `approval.completed` which triggers `applyAdjustment()`.

### `attendanceService.applyAdjustment(organizationId, adjustment)`
Applies an approved attendance adjustment:
- Creates the `AttendanceRecord` if it doesn't exist.
- Otherwise updates existing record with new `checkIn`, `checkOut`, `status`, `workedMinutes`.
- Appends adjustment reason to `notes`.
- Emits `attendance.adjusted` event.

### `attendanceService.generatePayrollSummary(organizationId, employeeId, month, year)`
Aggregates monthly attendance records for payroll calculation:
- Counts `workingDays` (excludes `WEEK_OFF`, `HOLIDAY`).
- Tallies `presentDays`, `leaveDays`, `unpaidDays`, `halfDays`, `lateDays`.
- Calculates `overtimeHours = max(0, totalWorkedMinutes - workingDays * fullDayMins) / 60`.

### `attendanceService.ensurePeriodOpen(organizationId, date)`
Looks up the `AttendancePeriod` for the given month/year. Throws `400` if the period exists and is not `OPEN` (e.g., `LOCKED` or `CLOSED`).

---

## Attendance Status Lifecycle

```
Check-In:
  → PRESENT (on time or within grace)
  → LATE    (check-in > shift.startTime + lateGraceMinutes)

Check-Out (may reclassify):
  PRESENT/LATE → HALF_DAY  (if workedMinutes < halfDayMinutes)
  PRESENT/LATE → ABSENT    (if workedMinutes < halfDayMinutes threshold, i.e. very short)

Leave Approval:
  Any status → ON_LEAVE  (leave service updates attendance records for approved leave dates)

Adjustment:
  Any status → newStatus (via adjustment, approved or direct)
```

---

## Event Integration

| Event Emitted | When | Consumed By |
|---|---|---|
| `attendance.checked-in` | Employee checks in | _(monitoring/logging)_ |
| `attendance.checked-out` | Employee checks out | _(monitoring/logging)_ |
| `attendance.adjusted` | Adjustment applied | _(monitoring/logging)_ |
| `approval.completed` (listened) | Adjustment approved | Calls `applyAdjustment()` |
