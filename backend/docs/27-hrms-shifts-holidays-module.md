# HRMS – Shifts & Holidays Modules

**Locations:**
- `src/domains/hrms/shifts/`
- `src/domains/hrms/holidays/`

## Shifts Module

Defines work shift patterns and assigns employees to shifts with effective date tracking. Shift assignments are used by the Attendance module for late detection.

### Files

| File | Purpose |
|---|---|
| `shift.service.ts` | Shift CRUD, assignment logic, dashboard metrics |
| `shift.controller.ts` | HTTP handling |
| `shift.routes.ts` | Route definitions |
| `shift.validators.ts` | Zod schemas |

### Routes

All routes are mounted at `/api/v1/shifts`.

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/shifts/dashboard/metrics` | `SHIFTS_MANAGE` | Get shift dashboard stats |
| `POST` | `/shifts` | `SHIFTS_MANAGE` | Create a new shift |
| `GET` | `/shifts` | `SHIFTS_MANAGE` | List all shifts |
| `PATCH` | `/shifts/:id` | `SHIFTS_MANAGE` | Update shift |
| `DELETE` | `/shifts/:id` | `SHIFTS_MANAGE` | Delete shift |

All routes require `authMiddleware`.

### Shift Model

| Field | Description |
|---|---|
| `name` | Unique shift name per org |
| `type` | Shift type (e.g. `MORNING`, `EVENING`, `NIGHT`) |
| `startTime` | HH:MM format (24hr) |
| `endTime` | HH:MM format (24hr) |
| `breakMinutes` | Unpaid break duration |
| `lateGraceMinutes` | Minutes after `startTime` before marking LATE |
| `earlyExitGraceMinutes` | Minutes before `endTime` allowed without penalty |
| `minimumWorkMinutes` | Minimum time to count as full attendance |
| `weeklyOffDays` | JSON array of day indices (0=Sun, 6=Sat) |
| `isNightShift` | Auto-computed: `true` if `endTime < startTime` |
| `isActive` | Whether shift is currently active |

### Service Functions

#### `shiftService.createShift(organizationId, actorUserId, data)`
1. Validates name uniqueness.
2. Auto-detects `isNightShift` (if `endTime < startTime` string comparison).
3. Creates shift. Records `SHIFT_CREATED` audit.

#### `shiftService.updateShift(organizationId, shiftId, actorUserId, data)`
1. Validates shift exists.
2. Validates name uniqueness (excluding self).
3. Recomputes `isNightShift` after update.
4. Records `SHIFT_UPDATED` audit.

#### `shiftService.deleteShift(organizationId, shiftId, actorUserId)`
- If shift has any active `EmployeeShiftAssignment` records: **soft-deletes** (preserves history).
- Otherwise: **hard-deletes**.
- Records `SHIFT_DELETED` audit.

#### `shiftService.assignShift(organizationId, employeeId, shiftId, effectiveFromStr, actorUserId)`
Assigns a shift to an employee with effective-date tracking:
1. Validates both employee and shift exist.
2. Normalizes `effectiveFrom` to midnight UTC.
3. Finds all existing assignments, ordered by date descending.
4. Throws `400` if the latest assignment starts on or after `effectiveFrom` (overlap prevention).
5. Closes the latest open assignment (sets its `effectiveTo` to `effectiveFrom - 1 day`).
6. Creates new `EmployeeShiftAssignment`.
7. Records `SHIFT_ASSIGNED` audit.

#### `shiftService.getEmployeeShifts(organizationId, employeeId)`
Returns all shift assignments for an employee with shift details, ordered by most recent first.

#### `shiftService.getDashboardMetrics(organizationId)`
Returns:
```typescript
{
  totalShifts: number;
  assignedCount: number;     // Employees with active shift assignment today
  unassignedCount: number;   // Active employees without current assignment
  nightShiftCount: number;   // Currently assigned to night shifts
  totalEmployees: number;
}
```

---

## Holidays Module

**Location:** `src/domains/hrms/holidays/`

Manages a calendar of public/organizational holidays. Holidays affect payroll (full-day attendance counted without deduction) and attendance status.

### Files

| File | Purpose |
|---|---|
| `holiday.service.ts` | Holiday CRUD with date conflict detection |
| `holiday.controller.ts` | HTTP handling |
| `holiday.routes.ts` | Route definitions |
| `holiday.validators.ts` | Zod schemas |

### Routes

All routes are mounted at `/api/v1/holidays`.

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/holidays` | `HOLIDAYS_MANAGE` | Create a holiday |
| `GET` | `/holidays` | `HOLIDAYS_MANAGE` | List holidays (filterable by year/month) |
| `GET` | `/holidays/:id` | `HOLIDAYS_MANAGE` | Get a single holiday |
| `PATCH` | `/holidays/:id` | `HOLIDAYS_MANAGE` | Update a holiday |
| `DELETE` | `/holidays/:id` | `HOLIDAYS_MANAGE` | Hard-delete a holiday |

All routes require `authMiddleware`.

### Holiday Model

| Field | Type | Description |
|---|---|---|
| `name` | string | Holiday name |
| `date` | DateTime | Exact date (stored as midnight UTC) |
| `isOptional` | boolean | Optional holiday (employee may choose to work) |

### Service Functions

#### `holidayService.createHoliday(organizationId, data)`
1. Validates no holiday exists for the same date (unique by `organizationId_date`).
2. Creates holiday with `startOfDay()` normalization.

#### `holidayService.updateHoliday(organizationId, id, data)`
1. Validates holiday exists.
2. If date changes: checks for conflict with another holiday on the new date.
3. Updates record.

#### `holidayService.getHolidays(organizationId, options)`
Paginated holiday list with optional `year` and `month` filtering using `date-fns` range helpers.

#### `holidayService.deleteHoliday(organizationId, id)`
Hard-deletes the holiday (no soft-delete – past holidays can simply be removed from the calendar).
