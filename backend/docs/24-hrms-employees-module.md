# HRMS – Employees Module

**Location:** `src/domains/hrms/employees/`

Manages the employee master data. Includes Employee profiles, Department management, and Designation management. Employees can have hierarchical manager relationships with cycle detection.

---

## Files

| File | Purpose |
|---|---|
| `employee.service.ts` | Employee, Department, Designation CRUD + hierarchy + documents |
| `employee.controller.ts` | HTTP handling for all three sub-resources |
| `employee.routes.ts` | Employee CRUD routes |
| `department.routes.ts` | Department CRUD routes |
| `designation.routes.ts` | Designation CRUD routes |
| `employee.repository.ts` | Data access (Prisma) |
| `employee.types.ts` | TypeScript interfaces |
| `employee.validators.ts` | Zod schemas |
| `index.ts` | Barrel exports |

---

## Routes

### Employees (`/api/v1/employees`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/employees` | `EMPLOYEES_CREATE` | Create a new employee |
| `GET` | `/employees` | `EMPLOYEES_VIEW` | List employees with filters |
| `GET` | `/employees/:id` | `EMPLOYEES_VIEW` | Get a single employee |
| `PUT` | `/employees/:id` | `EMPLOYEES_EDIT` | Update employee |
| `DELETE` | `/employees/:id` | `EMPLOYEES_DELETE` | Soft-delete employee |
| `GET` | `/employees/:id/hierarchy` | `EMPLOYEES_VIEW` | Get manager + direct reports |

### Departments (`/api/v1/departments`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/departments` | `DEPARTMENTS_MANAGE` | Create department |
| `GET` | `/departments` | `EMPLOYEES_VIEW` | List departments |
| `PUT` | `/departments/:id` | `DEPARTMENTS_MANAGE` | Update department |
| `DELETE` | `/departments/:id` | `DEPARTMENTS_MANAGE` | Soft-delete department |

### Designations (`/api/v1/designations`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/designations` | `DEPARTMENTS_MANAGE` | Create designation |
| `GET` | `/designations` | `EMPLOYEES_VIEW` | List designations |
| `PUT` | `/designations/:id` | `DEPARTMENTS_MANAGE` | Update designation |
| `DELETE` | `/designations/:id` | `DEPARTMENTS_MANAGE` | Soft-delete designation |

All routes require `authMiddleware`.

---

## Types (`employee.types.ts`)

### `CreateEmployeeInput`
```typescript
{
  firstName: string;
  lastName: string;
  officialEmail?: string;
  personalEmail?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: Gender;          // "MALE" | "FEMALE" | "OTHER"
  joiningDate: Date;
  confirmationDate?: Date;
  terminationDate?: Date;
  designationId?: string;
  departmentId?: string;
  managerId?: string;
  employmentType: EmploymentType; // "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN"
  status: EmployeeStatus;  // "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION"
  isActive?: boolean;
  isDriver?: boolean;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: Date;
  profileImageUrl?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}
```

### `EmployeeHierarchyResponse`
```typescript
{
  employee: EmployeeHierarchyNode;
  manager: EmployeeHierarchyNode | null;
  subordinates: EmployeeHierarchyNode[];
}
```

### `EmployeeFilters`
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  managerId?: string;
  isDriver?: boolean;
}
```

---

## Service Functions (`employee.service.ts`)

### Employee CRUD

#### `employeeService.createEmployee(organizationId, userId, data)`
1. Validates `officialEmail` and `personalEmail` uniqueness within org.
2. Auto-generates `employeeCode` using `EmployeeSequence` (format: `EMP-0001`, `EMP-0002`, ...).
3. Creates employee record.
4. Records `EMPLOYEE_CREATED` audit event.

#### `employeeService.updateEmployee(id, organizationId, userId, data)`
1. Validates employee exists.
2. If `managerId` changes: runs **`checkHierarchyCycle`** to prevent circular reporting.
3. Validates `officialEmail` uniqueness (excluding self).
4. Generates field-level diff and records `EMPLOYEE_UPDATED` audit event with `{ changes: diffs }`.

#### `employeeService.deleteEmployee(id, organizationId, userId)`
1. Checks for subordinates (`Employee.managerId = id`). Throws `400` if any exist (must reassign first).
2. Soft-deletes employee.
3. Records `EMPLOYEE_DELETED` audit event.

#### `employeeService.getHierarchy(id, organizationId)`
Returns the employee's manager and direct reports from `employeeRepository.getEmployeeHierarchy()`.

### Hierarchy Cycle Detection

#### `employeeService.checkHierarchyCycle(employeeId, managerId, organizationId)`
Traverses the manager chain upward from `managerId` checking if `employeeId` ever appears. Throws `400 "Circular hierarchy detected"` if found. Prevents employees from being their own manager or indirect manager.

### Employee Code Generation

#### `employeeService.generateEmployeeCode(organizationId)`
Uses `EmployeeSequence` table (upsert + atomic increment) to generate sequential codes:
- `EMP-0001`, `EMP-0002`, etc.
- Each organization has its own sequence counter.

### Documents

#### `employeeService.addDocument(employeeId, organizationId, userId, data)`
Attaches a document to an employee. Supports: `documentName`, `documentType`, `fileUrl`, `expiryDate`. Records `DOCUMENT_ADDED` audit event.

#### `employeeService.deleteDocument(employeeId, documentId, organizationId, userId)`
Removes a document association. Records `DOCUMENT_REMOVED` audit event.

### Timeline

#### `employeeService.getTimeline(employeeId, organizationId)`
Returns all `AuditLog` entries for `entityType: "employee"` and `entityId: employeeId` in descending order, including actor details.

### Departments

| Function | Logic |
|---|---|
| `createDepartment` | Unique by `name`. If soft-deleted with same name exists, reactivates it instead of creating new. |
| `updateDepartment` | Validates new name uniqueness. |
| `deleteDepartment` | Throws `400` if any active employees belong to it. |

### Designations

| Function | Logic |
|---|---|
| `createDesignation` | Unique by `name`. Reactivates if previously soft-deleted. |
| `updateDesignation` | Validates new name uniqueness. |
| `deleteDesignation` | Throws `400` if any active employees hold this designation. |
