# HRMS – Payroll Module

**Location:** `src/domains/hrms/payroll/`

Manages salary component definitions, employee salary structure assignments, payroll run generation, and the approval-to-processing pipeline. Payroll runs consume attendance summaries from the Attendance module and emit domain events consumed by the Accounting module.

---

## Files

| File | Purpose |
|---|---|
| `payroll.service.ts` | Salary component CRUD, structure assignment, payroll run generation, approval submission |
| `payroll.controller.ts` | HTTP handling |
| `payroll.routes.ts` | Route definitions |
| `payroll.repository.ts` | Data access for `SalaryComponent`, `EmployeeSalaryStructure`, `PayrollRun`, `Payslip` |
| `payroll.types.ts` | TypeScript interfaces |
| `payroll.validators.ts` | Zod schemas |

---

## Routes

All routes are mounted at `/api/v1/payroll`.

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/payroll/components` | `PAYROLL_MANAGE` | Create a salary component |
| `GET` | `/payroll/components` | `PAYROLL_READ` | List all salary components |
| `POST` | `/payroll/structures` | `PAYROLL_MANAGE` | Assign salary structure to employee |
| `GET` | `/payroll/structures/:employeeId` | `PAYROLL_READ` | Get salary structure for employee |
| `POST` | `/payroll/runs/generate` | `PAYROLL_RUN` | Generate payroll for a month/year |
| `POST` | `/payroll/runs/:id/submit` | `PAYROLL_RUN` | Submit a DRAFT payroll run for approval |
| `GET` | `/payroll/runs/:id` | `PAYROLL_READ` | Get a payroll run with payslips |

All routes require `authMiddleware` + `tenantContextMiddleware`.

---

## Types (`payroll.types.ts`)

### `CreateSalaryComponentInput`
```typescript
{
  name: string;
  calculationType: "FLAT" | "PERCENTAGE";
  amount?: number;       // For FLAT type
  percentage?: number;   // For PERCENTAGE type (% of BASIC)
  isEarning: boolean;    // true = earning (e.g. HRA), false = deduction (e.g. PF)
}
```

### `AssignStructureInput`
```typescript
{
  employeeId: string;
  componentId: string;
  amount?: number;       // Override flat amount
  percentage?: number;   // Override percentage
  effectiveDate: string; // ISO date for history tracking
}
```

### `GeneratePayrollInput`
```typescript
{
  month: number;  // 1-12
  year: number;
}
```

---

## Salary Component System

### Component Types

| `calculationType` | How amount is computed |
|---|---|
| `FLAT` | Fixed amount (e.g. Basic Salary = ₹50,000) |
| `PERCENTAGE` | Percentage of `BASIC` component (e.g. HRA = 40% of Basic) |

### Earnings vs Deductions

| `isEarning` | Example |
|---|---|
| `true` | Basic, HRA, Allowances |
| `false` | PF (Provident Fund), ESI, Tax |

---

## Service Functions (`payroll.service.ts`)

### `payrollService.createSalaryComponent(organizationId, payload)`
Creates a new salary component definition (e.g., "Basic", "HRA", "PF").

### `payrollService.assignStructure(organizationId, payload)`
Assigns or updates a salary component for an employee using **upsert**:
1. **Inside `prisma.$transaction`**:
   - Upserts `EmployeeSalaryStructure` (unique by `employeeId + componentId`).
   - Creates a `SalaryStructureHistory` entry for audit/history tracking.

### `payrollService.generatePayrollRun(organizationId, payload)`
Generates a monthly payroll run for all active employees:
1. Checks if a run already exists for `month/year`. If `DRAFT` or `CANCELLED` → deletes and regenerates. If any other status → throws `400`.
2. Fetches `PayrollPolicy` (pro-ration settings).
3. Fetches all active employees.
4. **Inside `prisma.$transaction`**:
   - Creates `PayrollRun` in `DRAFT` status.
   - For each employee:
     - Fetches attendance summary via `attendanceService.generatePayrollSummary()`.
     - Snapshots attendance data into `PayrollRunEmployee`.
     - Fetches `EmployeeSalaryStructure` with components.
     - **Identifies `BASIC` component** for percentage-based calculations.
     - **Computes pro-ration factor** if `PayrollPolicy.prorateByAttendance: true`:
       ```
       payableDays = presentDays + leaveDays + (halfDays * 0.5)
       prorationFactor = min(1.0, payableDays / workingDays)
       ```
       where `workingDays` uses either `WORKING_DAYS` or calendar days based on `workingDayBasis`.
     - For each component:
       - `FLAT` → `computedAmount = item.amount || component.amount`
       - `PERCENTAGE` → `computedAmount = basicAmount * (percentage / 100)`
       - Earnings are multiplied by `prorationFactor`.
       - Rounded to 2 decimal places.
     - Creates `Payslip` with `lineItems` if the employee has any components.
     - Accumulates `runGross`, `runDeds`, `runNet`.
   - Updates `PayrollRun` with totals.
5. Returns the created run.

### `payrollService.submitForApproval(organizationId, runId, userId)`
1. Validates run exists and is `DRAFT`.
2. Submits to Approval Engine with `entityType: "PAYROLL_RUN"`.
3. Updates run status to `PENDING_APPROVAL`.

---

## Payroll Run Lifecycle

```
generatePayrollRun() → DRAFT
submitForApproval()  → PENDING_APPROVAL
  ↓ (Approval Engine: approval.completed)
APPROVED → payroll.processed event emitted
  ↓ (Approval Engine: approval.rejected)
CANCELLED
```

---

## Event Integration

| Event Listened | Source | Action |
|---|---|---|
| `approval.completed` (entityType: `PAYROLL_RUN`) | Approvals Engine | Sets run `status = APPROVED`, emits `payroll.processed` |
| `approval.rejected` (entityType: `PAYROLL_RUN`) | Approvals Engine | Sets run `status = CANCELLED` |

| Event Emitted | When | Consumed By |
|---|---|---|
| `payroll.processed` | After payroll approved | Accounting module (future: posts salary expense journal) |

---

## Payslip Structure

Each approved payroll run generates one `Payslip` per employee:

```typescript
{
  payrollRunId: string;
  employeeId: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;         // grossPay - totalDeductions
  lineItems: Array<{
    componentName: string;
    isEarning: boolean;
    amount: number;
  }>;
}
```
