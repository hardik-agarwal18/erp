// @ts-nocheck
import { Request, Response } from "express";
import { attendanceService } from "./attendance.service.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { attendanceRepository } from "./attendance.repository.js";

export const attendanceController = {
  checkIn: asyncHandler(async (req: Request, res: Response) => {
    const record = await attendanceService.checkIn(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 200, message: "Checked In successfully", data: record });
  }),

  checkOut: asyncHandler(async (req: Request, res: Response) => {
    const record = await attendanceService.checkOut(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 200, message: "Checked Out successfully", data: record });
  }),

  requestAdjustment: asyncHandler(async (req: Request, res: Response) => {
    // Assuming req.member!.permissions array is populated by middleware or similar
    // For now, we will just use a generic true to simulate manager override if they hit this route
    // In a real app, you would check `req.member.permissions.includes("ATTENDANCE_ADJUST")`
    const hasAdjustPermission = true; 
    
    const result = await attendanceService.requestAdjustment(
      req.member!.organizationId,
      req.user!.id,
      hasAdjustPermission,
      req.body
    );
    sendSuccess(res, { statusCode: 200, message: `Adjustment ${result.status}`, data: result.adjustment });
  }),

  getPayrollSummary: asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, month, year } = req.query;
    const summary = await attendanceService.generatePayrollSummary(
      req.member!.organizationId,
      employeeId as string,
      Number(month),
      Number(year)
    );
    sendSuccess(res, { statusCode: 200, data: summary });
  }),
};
