
import { Request, Response } from "express";
import { payrollService } from "./payroll.service.js";
import { payrollRepository } from "./payroll.repository.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const payrollController = {
  createComponent: asyncHandler(async (req: Request, res: Response) => {
    const component = await payrollService.createSalaryComponent(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Component created", data: component });
  }),

  listComponents: asyncHandler(async (req: Request, res: Response) => {
    const components = await payrollRepository.listSalaryComponents(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: components });
  }),

  assignStructure: asyncHandler(async (req: Request, res: Response) => {
    const structure = await payrollService.assignStructure(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 200, message: "Structure assigned", data: structure });
  }),

  getStructure: asyncHandler(async (req: Request, res: Response) => {
    const structure = await payrollRepository.getEmployeeStructure(req.member!.organizationId, req.params.employeeId as string);
    sendSuccess(res, { statusCode: 200, data: structure });
  }),

  generatePayroll: asyncHandler(async (req: Request, res: Response) => {
    const run = await payrollService.generatePayrollRun(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Payroll generated in DRAFT", data: run });
  }),

  submitForApproval: asyncHandler(async (req: Request, res: Response) => {
    await payrollService.submitForApproval(req.member!.organizationId, req.params.id as string, req.user!.id);
    sendSuccess(res, { statusCode: 200, message: "Payroll run submitted for approval" });
  }),

  getPayrollRun: asyncHandler(async (req: Request, res: Response) => {
    const run = await payrollRepository.getPayrollRun(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: run });
  }),

  getMyPayslips: asyncHandler(async (req: Request, res: Response) => {
    // Similarly, we need the employee ID.
    const employeeId = (req.query.employeeId as string) || req.user!.id;
    const payslips = await payrollService.getMyPayslips(req.member!.organizationId, employeeId);
    sendSuccess(res, { statusCode: 200, data: payslips });
  }),

  getMyPayslip: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.id;
    const payslip = await payrollService.getPayslipById(req.member!.organizationId, req.params.id as string, employeeId);
    sendSuccess(res, { statusCode: 200, data: payslip });
  }),

  getPayslipPdf: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.id;
    const pdfBuffer = await payrollService.generatePayslipPdf(req.member!.organizationId, req.params.id as string, employeeId);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=payslip-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  }),
};
