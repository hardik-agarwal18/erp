// @ts-nocheck
import { prisma } from "../../../../config/database.js";
import { Prisma } from "@prisma/client";
import { EmployeeFilters, DepartmentFilters, DesignationFilters } from "./employee.types.js";

export const employeeRepository = {
  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  createEmployee: async (organizationId: string, data: Prisma.EmployeeUncheckedCreateInput | any) => {
    return prisma.employee.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  updateEmployee: async (id: string, organizationId: string, data: Prisma.EmployeeUncheckedUpdateInput | any) => {
    return prisma.employee.update({
      where: { id, organizationId },
      data,
    });
  },

  getEmployeeById: async (id: string, organizationId: string) => {
    return prisma.employee.findUnique({
      where: { id, organizationId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        manager: true,
        documents: true,
      },
    });
  },

  listEmployees: async (organizationId: string, filters: EmployeeFilters) => {
    const { page = 1, limit = 20, search, departmentId, designationId, status, employmentType, managerId, isDriver } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {
      organizationId,
      deletedAt: null,
      ...(departmentId && { departmentId }),
      ...(designationId && { designationId }),
      ...(status && { status }),
      ...(employmentType && { employmentType }),
      ...(managerId && { managerId }),
      ...(isDriver !== undefined && { isDriver }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { employeeCode: { contains: search, mode: "insensitive" } },
          { officialEmail: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          designation: true,
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  softDeleteEmployee: async (id: string, organizationId: string) => {
    return prisma.employee.update({
      where: { id, organizationId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },

  getLastEmployeeCode: async (organizationId: string) => {
    return prisma.employee.findFirst({
      where: { organizationId },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
  },

  getEmployeeHierarchy: async (id: string, organizationId: string) => {
    const employee = await prisma.employee.findUnique({
      where: { id, organizationId, deletedAt: null },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            profileImageUrl: true,
          }
        },
        subordinates: {
          where: { deletedAt: null },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            profileImageUrl: true,
          }
        }
      }
    });

    if (!employee) return null;

    return {
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        designation: employee.designation,
        profileImageUrl: employee.profileImageUrl,
      },
      manager: employee.manager,
      subordinates: employee.subordinates,
    };
  },

  // ----------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------
  createDepartment: async (organizationId: string, data: Prisma.DepartmentUncheckedCreateInput | any) => {
    return prisma.department.create({
      data: { ...data, organizationId },
    });
  },

  updateDepartment: async (id: string, organizationId: string, data: Prisma.DepartmentUncheckedUpdateInput | any) => {
    return prisma.department.update({
      where: { id, organizationId },
      data,
    });
  },

  listDepartments: async (organizationId: string, filters: DepartmentFilters) => {
    const { page = 1, limit = 50, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {
      organizationId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.department.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  softDeleteDepartment: async (id: string, organizationId: string) => {
    return prisma.department.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  // ----------------------------------------------------
  // DESIGNATIONS
  // ----------------------------------------------------
  createDesignation: async (organizationId: string, data: Prisma.DesignationUncheckedCreateInput | any) => {
    return prisma.designation.create({
      data: { ...data, organizationId },
    });
  },

  updateDesignation: async (id: string, organizationId: string, data: Prisma.DesignationUncheckedUpdateInput | any) => {
    return prisma.designation.update({
      where: { id, organizationId },
      data,
    });
  },

  listDesignations: async (organizationId: string, filters: DesignationFilters) => {
    const { page = 1, limit = 50, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DesignationWhereInput = {
      organizationId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        orderBy: [{ level: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.designation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  softDeleteDesignation: async (id: string, organizationId: string) => {
    return prisma.designation.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  },
  
  // ----------------------------------------------------
  // DOCUMENTS
  // ----------------------------------------------------
  addDocument: async (employeeId: string, data: Prisma.EmployeeDocumentUncheckedCreateWithoutEmployeeInput) => {
    return prisma.employeeDocument.create({
      data: {
        ...data,
        employeeId,
      }
    });
  },
  
  deleteDocument: async (id: string, employeeId: string) => {
    return prisma.employeeDocument.delete({
      where: { id, employeeId }
    });
  }
};
