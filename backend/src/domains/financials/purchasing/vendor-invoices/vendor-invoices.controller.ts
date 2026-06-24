import { Request, Response } from "express";
import { vendorInvoicesService } from "./vendor-invoices.service.js";
import { apAnalyticsService } from "./ap-analytics.service.js";
import { sendSuccess } from "../../../../utils/apiResponse.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const vendorInvoicesController = {
  createDraft: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.createDraft(req.member!.organizationId, req.user!.id, req.body);
    sendSuccess(res, { statusCode: 201, message: "Vendor Invoice draft created", data: invoice });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const invoices = await vendorInvoicesService.list(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: invoices });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.getById(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: invoice });
  }),

  performThreeWayMatch: asyncHandler(async (req: Request, res: Response) => {
    const summary = await vendorInvoicesService.performThreeWayMatch(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: summary });
  }),

  postInvoice: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await vendorInvoicesService.postInvoice(
      req.member!.organizationId,
      req.user!.id,
      req.params.id as string,
      req.body.forceOverride
    );
    sendSuccess(res, { statusCode: 200, message: "Vendor Invoice posted successfully", data: invoice });
  }),

  getApAging: asyncHandler(async (req: Request, res: Response) => {
    const aging = await apAnalyticsService.getApAging(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: aging });
  }),

  getVendorStatement: asyncHandler(async (req: Request, res: Response) => {
    const statement = await apAnalyticsService.getVendorStatement(req.member!.organizationId, req.params.vendorId as string);
    sendSuccess(res, { statusCode: 200, data: statement });
  })
};
