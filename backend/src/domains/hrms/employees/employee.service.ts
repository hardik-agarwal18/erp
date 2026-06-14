
import ApiError from "../../../utils/ApiError.js";
import { employeeRepository } from "./employee.repository.js";
import { 
  CreateEmployeeInput, 
  UpdateEmployeeInput, 
  EmployeeFilters,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentFilters,
  CreateDesignationInput,
  UpdateDesignationInput,
  DesignationFilters
} from "./employee.types.js";
import { prisma } from "../../../config/database.js";
import { auditService } from "../../../services/audit/audit.service.js";

export const employeeService = {
  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  generateEmployeeCode: async (organizationId: string): Promise<string> => {
    const seq = await prisma.employeeSequence.upsert({
      where: { organizationId },
      update: { nextNumber: { increment: 1 } },
      create: { organizationId, nextNumber: 2 },
    });
    return `EMP-${String(seq.nextNumber - 1).padStart(4, "0")}`;
  },

  checkHierarchyCycle: async (employeeId: string, managerId: string, organizationId: string): Promise<void> => {
    if (employeeId === managerId) {
      throw new ApiError(400, "Employee cannot be their own manager");
    }

    // Traverse upwards from managerId to see if we eventually hit employeeId
    let currentManagerId: string | null = managerId;
    const visited = new Set<string>();

    while (currentManagerId) {
      if (visited.has(currentManagerId)) {
        throw new ApiError(400, "Circular hierarchy detected");
      }
      visited.add(currentManagerId);

      if (currentManagerId === employeeId) {
        throw new ApiError(400, "Circular hierarchy detected: Employee cannot report to their own subordinate");
      }

      const managerRecord = await employeeRepository.getEmployeeById(currentManagerId, organizationId);
      if (!managerRecord) {
        break; // Reached the top or an invalid manager
      }
      currentManagerId = managerRecord.managerId;
    }
  },

  createEmployee: async (organizationId: string, userId: string, data: CreateEmployeeInput) => {
    // 1. Validate uniqueness of emails if provided
    if (data.officialEmail) {
      const existing = await prisma.employee.findFirst({
        where: { organizationId, officialEmail: data.officialEmail, deletedAt: null }
      });
      if (existing) throw new ApiError(400, "Official email already in use");
    }
    if (data.personalEmail) {
      const existing = await prisma.employee.findFirst({
        where: { organizationId, personalEmail: data.personalEmail, deletedAt: null }
      });
      if (existing) throw new ApiError(400, "Personal email already in use");
    }

    // 2. Generate employee code
    const employeeCode = await employeeService.generateEmployeeCode(organizationId);

    // 3. Create
    const employee = await employeeRepository.createEmployee(organizationId, {
      ...data,
      employeeCode,
    });

    await auditService.record({
      organizationId,
      userId,
      entityType: "employee",
      entityId: employee.id,
      action: "EMPLOYEE_CREATED",
    });

    return employee;
  },

  updateEmployee: async (id: string, organizationId: string, userId: string, data: UpdateEmployeeInput) => {
    // 1. Ensure employee exists
    const employee = await employeeRepository.getEmployeeById(id, organizationId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // 2. Validate manager assignment (cycle detection)
    if (data.managerId && data.managerId !== employee.managerId) {
      await employeeService.checkHierarchyCycle(id, data.managerId, organizationId);
    }

    // 3. Validate email uniqueness
    if (data.officialEmail && data.officialEmail !== employee.officialEmail) {
      const existing = await prisma.employee.findFirst({
        where: { organizationId, officialEmail: data.officialEmail, deletedAt: null, id: { not: id } }
      });
      if (existing) throw new ApiError(400, "Official email already in use");
    }

    const updatedEmployee = await employeeRepository.updateEmployee(id, organizationId, data);

    // Generate diffs
    const diffs: Record<string, { oldValue: any; newValue: any }> = {};
    for (const key of Object.keys(data)) {
      const k = key as keyof typeof data;
      const oldVal = (employee as any)[k];
      const newVal = (data as any)[k];

      if (newVal !== undefined && oldVal !== newVal) {
        diffs[k] = { oldValue: oldVal, newValue: newVal };
      }
    }

    if (Object.keys(diffs).length > 0) {
      await auditService.record({
        organizationId,
        userId,
        entityType: "employee",
        entityId: id,
        action: "EMPLOYEE_UPDATED",
        metadata: { changes: diffs },
      });
    }

    return updatedEmployee;
  },

  getEmployee: async (id: string, organizationId: string) => {
    const employee = await employeeRepository.getEmployeeById(id, organizationId);
    if (!employee) throw new ApiError(404, "Employee not found");
    return employee;
  },

  listEmployees: async (organizationId: string, filters: EmployeeFilters) => {
    return employeeRepository.listEmployees(organizationId, filters);
  },

  getDashboardMetrics: async (organizationId: string) => {
    // 1. Total Employees
    const totalEmployees = await prisma.employee.count({
      where: { organizationId, deletedAt: null, isActive: true }
    });

    // 2. Recent Hires (joined in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHires = await prisma.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        joiningDate: { gte: thirtyDaysAgo }
      },
      orderBy: { joiningDate: "desc" },
      take: 5
    });

    // 3. Upcoming Birthdays (next 30 days)
    // Prisma doesn't have native day/month extraction in findMany, so we fetch active employees with DOB
    const employeesWithDob = await prisma.employee.findMany({
      where: { organizationId, deletedAt: null, isActive: true, dateOfBirth: { not: null } },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, profileImageUrl: true, designation: { select: { name: true } } }
    });

    const today = new Date();
    const upcomingBirthdays = employeesWithDob.filter(emp => {
      const dob = new Date(emp.dateOfBirth!);
      dob.setFullYear(today.getFullYear());
      if (dob < today) dob.setFullYear(today.getFullYear() + 1);
      const diffDays = (dob.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).sort((a, b) => {
      const dobA = new Date(a.dateOfBirth!);
      dobA.setFullYear(today.getFullYear());
      if (dobA < today) dobA.setFullYear(today.getFullYear() + 1);
      const dobB = new Date(b.dateOfBirth!);
      dobB.setFullYear(today.getFullYear());
      if (dobB < today) dobB.setFullYear(today.getFullYear() + 1);
      return dobA.getTime() - dobB.getTime();
    }).slice(0, 5);

    // 4. Department Count
    const totalDepartments = await prisma.department.count({
      where: { organizationId, deletedAt: null, isActive: true }
    });

    // 5. Headcount by Department
    const employeesByDept = await prisma.employee.groupBy({
      by: ['departmentId'],
      where: { organizationId, deletedAt: null, isActive: true },
      _count: { id: true }
    });
    const deptIds = employeesByDept.map(e => e.departmentId).filter(Boolean) as string[];
    const depts = await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
    const headcountByDepartment = employeesByDept.map(e => ({
      department: e.departmentId ? depts.find(d => d.id === e.departmentId)?.name || 'Unknown' : 'Unassigned',
      count: e._count.id
    })).sort((a, b) => b.count - a.count);

    // 6. Employment Type
    const employeesByEmpType = await prisma.employee.groupBy({
      by: ['employmentType'],
      where: { organizationId, deletedAt: null, isActive: true },
      _count: { id: true }
    });
    const headcountByEmploymentType = employeesByEmpType.map(e => ({
      type: e.employmentType.replace(/_/g, ' '),
      count: e._count.id
    })).sort((a, b) => b.count - a.count);

    // 7. Gender Diversity
    const employeesByGender = await prisma.employee.groupBy({
      by: ['gender'],
      where: { organizationId, deletedAt: null, isActive: true },
      _count: { id: true }
    });
    const genderDiversity = employeesByGender.map(e => ({
      gender: e.gender || 'Not Specified',
      count: e._count.id
    })).sort((a, b) => b.count - a.count);

    const kpis = [
      {
        label: "Total Employees",
        value: totalEmployees,
        detail: "Active employees",
      },
      {
        label: "Recent Hires",
        value: recentHires.length,
        detail: "Joined in last 30 days",
      },
      {
        label: "Departments",
        value: totalDepartments,
        detail: "Active departments",
      }
    ];

    return { 
      kpis, 
      recentHires, 
      upcomingBirthdays,
      headcountByDepartment,
      headcountByEmploymentType,
      genderDiversity
    };
  },

  deleteEmployee: async (id: string, organizationId: string, userId: string) => {
    const employee = await employeeRepository.getEmployeeById(id, organizationId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // Check if anyone reports to this employee before deleting
    const subordinates = await prisma.employee.count({
      where: { managerId: id, deletedAt: null }
    });
    if (subordinates > 0) {
      throw new ApiError(400, "Cannot delete employee who has direct reports. Reassign them first.");
    }

    const deleted = await employeeRepository.softDeleteEmployee(id, organizationId);
    
    await auditService.record({
      organizationId,
      userId,
      entityType: "employee",
      entityId: id,
      action: "EMPLOYEE_DELETED",
    });

    return deleted;
  },

  getHierarchy: async (id: string, organizationId: string) => {
    const hierarchy = await employeeRepository.getEmployeeHierarchy(id, organizationId);
    if (!hierarchy) throw new ApiError(404, "Employee not found");
    return hierarchy;
  },

  // ----------------------------------------------------
  // DOCUMENTS
  // ----------------------------------------------------
  addDocument: async (employeeId: string, organizationId: string, userId: string, data: { documentName: string, documentType: string, fileUrl: string, expiryDate?: Date }) => {
    const employee = await employeeRepository.getEmployeeById(employeeId, organizationId);
    if (!employee) throw new ApiError(404, "Employee not found");

    const doc = await employeeRepository.addDocument(employeeId, data);
    
    await auditService.record({
      organizationId,
      userId,
      entityType: "employee",
      entityId: employeeId,
      action: "DOCUMENT_ADDED",
      metadata: { documentName: data.documentName, documentType: data.documentType },
    });

    return doc;
  },

  deleteDocument: async (employeeId: string, documentId: string, organizationId: string, userId: string) => {
    const employee = await employeeRepository.getEmployeeById(employeeId, organizationId);
    if (!employee) throw new ApiError(404, "Employee not found");

    const doc = employee.documents.find(d => d.id === documentId);
    if (!doc) throw new ApiError(404, "Document not found");

    await employeeRepository.deleteDocument(documentId, employeeId);

    await auditService.record({
      organizationId,
      userId,
      entityType: "employee",
      entityId: employeeId,
      action: "DOCUMENT_REMOVED",
      metadata: { documentName: doc.documentName, documentType: doc.documentType },
    });
  },

  getTimeline: async (employeeId: string, organizationId: string) => {
    // Audit logs for this employee
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: "employee",
        entityId: employeeId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true } }
      }
    });
    return logs;
  },

  // ----------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------
  createDepartment: async (organizationId: string, data: CreateDepartmentInput) => {
    const existing = await prisma.department.findUnique({
      where: { organizationId_name: { organizationId, name: data.name } }
    });
    if (existing) {
      if (existing.deletedAt) {
        return employeeRepository.updateDepartment(existing.id, organizationId, { ...data, deletedAt: null, isActive: true });
      }
      throw new ApiError(400, "Department already exists");
    }
    return employeeRepository.createDepartment(organizationId, data);
  },

  updateDepartment: async (id: string, organizationId: string, data: UpdateDepartmentInput) => {
    if (data.name) {
      const existing = await prisma.department.findUnique({
        where: { organizationId_name: { organizationId, name: data.name } }
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ApiError(400, "Department name already in use");
      }
    }
    return employeeRepository.updateDepartment(id, organizationId, data);
  },

  listDepartments: async (organizationId: string, filters: DepartmentFilters) => {
    return employeeRepository.listDepartments(organizationId, filters);
  },

  deleteDepartment: async (id: string, organizationId: string) => {
    // Check if any active employees are assigned to this department
    const employeeCount = await prisma.employee.count({
      where: { departmentId: id, deletedAt: null }
    });
    if (employeeCount > 0) {
      throw new ApiError(400, `Cannot delete department. ${employeeCount} active employees are assigned to it.`);
    }
    return employeeRepository.softDeleteDepartment(id, organizationId);
  },

  // ----------------------------------------------------
  // DESIGNATIONS
  // ----------------------------------------------------
  createDesignation: async (organizationId: string, data: CreateDesignationInput) => {
    const existing = await prisma.designation.findUnique({
      where: { organizationId_name: { organizationId, name: data.name } }
    });
    if (existing) {
      if (existing.deletedAt) {
        return employeeRepository.updateDesignation(existing.id, organizationId, { ...data, deletedAt: null, isActive: true });
      }
      throw new ApiError(400, "Designation already exists");
    }
    return employeeRepository.createDesignation(organizationId, data);
  },

  updateDesignation: async (id: string, organizationId: string, data: UpdateDesignationInput) => {
    if (data.name) {
      const existing = await prisma.designation.findUnique({
        where: { organizationId_name: { organizationId, name: data.name } }
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ApiError(400, "Designation name already in use");
      }
    }
    return employeeRepository.updateDesignation(id, organizationId, data);
  },

  listDesignations: async (organizationId: string, filters: DesignationFilters) => {
    return employeeRepository.listDesignations(organizationId, filters);
  },

  deleteDesignation: async (id: string, organizationId: string) => {
    const employeeCount = await prisma.employee.count({
      where: { designationId: id, deletedAt: null }
    });
    if (employeeCount > 0) {
      throw new ApiError(400, `Cannot delete designation. ${employeeCount} active employees are assigned to it.`);
    }
    return employeeRepository.softDeleteDesignation(id, organizationId);
  }
};
