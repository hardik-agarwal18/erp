import { Request, Response } from "express";
import { leavesService } from "./leaves.service.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const leavesController = {
  applyForLeave: asyncHandler(async (req: Request, res: Response) => {
    const application = await leavesService.applyForLeave(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Leave applied successfully", data: application });
  }),

  submitForApproval: asyncHandler(async (req: Request, res: Response) => {
    const application = await leavesService.submitForApproval(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id
    );
    sendSuccess(res, { statusCode: 200, message: "Leave submitted for approval", data: application });
  }),

  listApplications: asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.query;
    const applications = await leavesService.listApplications(
      req.member!.organizationId,
      employeeId as string | undefined
    );
    sendSuccess(res, { statusCode: 200, data: applications });
  }),

  getApplicationById: asyncHandler(async (req: Request, res: Response) => {
    const application = await leavesService.getApplicationById(
      req.member!.organizationId,
      req.params.id as string
    );
    sendSuccess(res, { statusCode: 200, data: application });
  }),

  getMyBalances: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.id; 
    const balances = await leavesService.getLeaveBalances(req.member!.organizationId, employeeId);
    sendSuccess(res, { statusCode: 200, data: balances });
  }),

  getEmployeeBalances: asyncHandler(async (req: Request, res: Response) => {
    const balances = await leavesService.getLeaveBalances(req.member!.organizationId, req.params.employeeId as string);
    res.json({ success: true, data: balances });
  }),
};
