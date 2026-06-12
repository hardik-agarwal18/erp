
import { Request, Response } from "express";
import { purchaseOrdersService } from "./purchase-orders.service.js";
import { sendSuccess } from "../../../../utils/apiResponse.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const purchaseOrdersController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseOrdersService.create(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Purchase Order created", data: po });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const pos = await purchaseOrdersService.list(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: pos });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseOrdersService.getById(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: po });
  }),

  submitForApproval: asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseOrdersService.submitForApproval(
      req.member!.organizationId,
      req.params.id as string,
      req.user!.id
    );
    sendSuccess(res, { statusCode: 200, message: "Purchase Order submitted for approval", data: po });
  }),
};
