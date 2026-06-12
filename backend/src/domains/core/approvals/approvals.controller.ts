// @ts-nocheck
import { Request, Response } from "express";
import { approvalsService } from "./approvals.service.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const approvalsController = {
  createTemplate: asyncHandler(async (req: Request, res: Response) => {
    const template = await approvalsService.createTemplate(
      req.member!.organizationId,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, message: "Template created", data: template });
  }),

  getPendingApprovals: asyncHandler(async (req: Request, res: Response) => {
    const pending = await approvalsService.getPendingApprovals(
      req.member!.organizationId,
      req.user!.id,
    );
    sendSuccess(res, { statusCode: 200, data: pending });
  }),

  getApprovalHistory: asyncHandler(async (req: Request, res: Response) => {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const history = await approvalsService.getApprovalHistory(
      req.member!.organizationId,
      entityType,
      entityId,
    );
    sendSuccess(res, { statusCode: 200, data: history });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const instance = await approvalsService.approve(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, message: "Approved successfully", data: instance });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const instance = await approvalsService.reject(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, message: "Rejected successfully", data: instance });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const instance = await approvalsService.cancel(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id,
    );
    sendSuccess(res, { statusCode: 200, message: "Cancelled successfully", data: instance });
  }),
};
