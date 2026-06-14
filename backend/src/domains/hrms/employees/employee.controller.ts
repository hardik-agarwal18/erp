
import { Request, Response } from "express";
import { employeeService } from "./employee.service.js";
import { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createDesignationSchema,
  updateDesignationSchema,
  addEmployeeDocumentSchema
} from "./employee.validators.js";
import { EmployeeStatus, EmploymentType } from "@prisma/client";

export const employeeController = {
  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  createEmployee: async (req: Request, res: Response) => {
    const data = createEmployeeSchema.parse(req.body);
    const employee = await employeeService.createEmployee(req.organization!.id, req.user!.id, data);
    res.status(201).json({ data: employee });
  },

  updateEmployee: async (req: Request, res: Response) => {
    const data = updateEmployeeSchema.parse(req.body);
    const employee = await employeeService.updateEmployee(req.params.id as string, req.organization!.id, req.user!.id, data);
    res.status(200).json({ data: employee });
  },

  getEmployee: async (req: Request, res: Response) => {
    const employee = await employeeService.getEmployee(req.params.id as string, req.organization!.id);
    res.status(200).json({ data: employee });
  },

  listEmployees: async (req: Request, res: Response) => {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      designationId: req.query.designationId as string | undefined,
      status: req.query.status as EmployeeStatus | undefined,
      employmentType: req.query.employmentType as EmploymentType | undefined,
      managerId: req.query.managerId as string | undefined,
      isDriver: req.query.isDriver ? req.query.isDriver === 'true' : undefined,
      joinedBefore: req.query.joinedBefore ? new Date(req.query.joinedBefore as string) : undefined,
      joinedAfter: req.query.joinedAfter ? new Date(req.query.joinedAfter as string) : undefined,
    };
    const employees = await employeeService.listEmployees(req.organization!.id, filters);
    res.status(200).json({ data: employees });
  },

  getDashboardMetrics: async (req: Request, res: Response) => {
    const data = await employeeService.getDashboardMetrics(req.organization!.id);
    res.status(200).json({ data });
  },

  deleteEmployee: async (req: Request, res: Response) => {
    await employeeService.deleteEmployee(req.params.id as string, req.organization!.id, req.user!.id);
    res.status(204).send();
  },

  getEmployeeHierarchy: async (req: Request, res: Response) => {
    const hierarchy = await employeeService.getHierarchy(req.params.id as string, req.organization!.id);
    res.status(200).json({ data: hierarchy });
  },

  // ----------------------------------------------------
  // DOCUMENTS & TIMELINE
  // ----------------------------------------------------
  addDocument: async (req: Request, res: Response) => {
    const data = addEmployeeDocumentSchema.parse(req.body);
    const doc = await employeeService.addDocument(req.params.id as string, req.organization!.id, req.user!.id, data);
    res.status(201).json({ data: doc });
  },

  deleteDocument: async (req: Request, res: Response) => {
    await employeeService.deleteDocument(req.params.id as string, req.params.documentId as string, req.organization!.id, req.user!.id);
    res.status(204).send();
  },

  getTimeline: async (req: Request, res: Response) => {
    const logs = await employeeService.getTimeline(req.params.id as string, req.organization!.id);
    res.status(200).json({ data: logs });
  },

  // ----------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------
  createDepartment: async (req: Request, res: Response) => {
    const data = createDepartmentSchema.parse(req.body);
    const department = await employeeService.createDepartment(req.organization!.id, data);
    res.status(201).json({ data: department });
  },

  updateDepartment: async (req: Request, res: Response) => {
    const data = updateDepartmentSchema.parse(req.body);
    const department = await employeeService.updateDepartment(req.params.id as string, req.organization!.id, data);
    res.status(200).json({ data: department });
  },

  listDepartments: async (req: Request, res: Response) => {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };
    const departments = await employeeService.listDepartments(req.organization!.id, filters);
    res.status(200).json({ data: departments });
  },

  deleteDepartment: async (req: Request, res: Response) => {
    await employeeService.deleteDepartment(req.params.id as string, req.organization!.id);
    res.status(204).send();
  },

  // ----------------------------------------------------
  // DESIGNATIONS
  // ----------------------------------------------------
  createDesignation: async (req: Request, res: Response) => {
    const data = createDesignationSchema.parse(req.body);
    const designation = await employeeService.createDesignation(req.organization!.id, data);
    res.status(201).json({ data: designation });
  },

  updateDesignation: async (req: Request, res: Response) => {
    const data = updateDesignationSchema.parse(req.body);
    const designation = await employeeService.updateDesignation(req.params.id as string, req.organization!.id, data);
    res.status(200).json({ data: designation });
  },

  listDesignations: async (req: Request, res: Response) => {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };
    const designations = await employeeService.listDesignations(req.organization!.id, filters);
    res.status(200).json({ data: designations });
  },

  deleteDesignation: async (req: Request, res: Response) => {
    await employeeService.deleteDesignation(req.params.id as string, req.organization!.id);
    res.status(204).send();
  }
};
