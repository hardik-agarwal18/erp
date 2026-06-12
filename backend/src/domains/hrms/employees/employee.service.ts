
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
