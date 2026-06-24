import { Request, Response } from "express";
import { paymentRunsService } from "./payment-runs.service.js";
import { sendSuccess } from "../../../../utils/apiResponse.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const paymentRunsController = {
  createPaymentBatch: asyncHandler(async (req: Request, res: Response) => {
    const batch = await paymentRunsService.createPaymentBatch(
       req.member!.organizationId,
       req.user!.id,
       req.body
    );
    sendSuccess(res, { statusCode: 201, message: "Payment Batch created", data: batch });
  }),

  submitForApproval: asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentRunsService.submitForApproval(
       req.member!.organizationId,
       req.user!.id,
       req.params.id as string
    );
    sendSuccess(res, { statusCode: 200, message: "Payment Batch submitted for approval", data: result });
  }),

  executePaymentBatch: asyncHandler(async (req: Request, res: Response) => {
    const batch = await paymentRunsService.executePaymentBatch(
       req.member!.organizationId,
       req.user!.id,
       req.params.id as string
    );
    sendSuccess(res, { statusCode: 200, message: "Payment Batch execution completed", data: batch });
  }),

  generateBankFile: asyncHandler(async (req: Request, res: Response) => {
    const csvContent = await paymentRunsService.generateBankFileCsv(
       req.member!.organizationId,
       req.params.id as string
    );
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bank_file_${req.params.id}.csv`);
    res.status(200).send(csvContent);
  }),

  getSuggestions: asyncHandler(async (req: Request, res: Response) => {
    const suggestions = await paymentRunsService.getSuggestions(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: suggestions });
  })
};
