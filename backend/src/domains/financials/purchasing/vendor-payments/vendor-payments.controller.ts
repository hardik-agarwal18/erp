import { Request, Response } from "express";
import { vendorPaymentsService } from "./vendor-payments.service.js";
import { sendSuccess } from "../../../../utils/apiResponse.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const vendorPaymentsController = {
  createPayment: asyncHandler(async (req: Request, res: Response) => {
    const payment = await vendorPaymentsService.createPayment(
       req.member!.organizationId,
       req.user!.id,
       req.body
    );
    sendSuccess(res, { statusCode: 201, message: "Vendor Payment created", data: payment });
  }),

  allocatePayment: asyncHandler(async (req: Request, res: Response) => {
    const allocation = await vendorPaymentsService.allocatePayment(
       req.member!.organizationId,
       req.user!.id,
       req.params.id as string,
       req.body.allocations
    );
    sendSuccess(res, { statusCode: 200, message: "Vendor Payment allocated", data: allocation });
  })
};
