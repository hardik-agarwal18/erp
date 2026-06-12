
import { Request, Response } from "express";
import { vendorInvoicesService } from "./vendor-invoices.service.js";
import { sendSuccess } from "../../../../utils/apiResponse.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const vendorInvoicesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.create(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Vendor Invoice created", data: invoice });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const invoices = await vendorInvoicesService.list(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: invoices });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.getById(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: invoice });
  }),

  postInvoice: asyncHandler(async (req: Request, res: Response) => {
    // Attempt standard posting. If three-way match fails, the service throws a 409 Conflict ApiError.
    const invoice = await vendorInvoicesService.postInvoice(
      req.member!.organizationId,
      req.params.id as string,
      false
    );
    sendSuccess(res, { statusCode: 200, message: "Vendor Invoice posted successfully", data: invoice });
  }),

  requestOverride: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.requestOverrideApproval(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id
    );
    sendSuccess(res, { statusCode: 200, message: "Override requested via Approval Engine", data: invoice });
  }),
};
