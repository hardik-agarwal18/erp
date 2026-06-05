import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { paymentService } from "./payment.service.js";

export const paymentController = {
  createPayment: async (req: Request, res: Response) => {
    const payment = await paymentService.createPayment(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: payment });
  },
  listPayments: async (req: Request, res: Response) => {
    const payments = await paymentService.listPayments(
      req.organization!.id,
      req.query.invoiceId as string | undefined,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: payments });
  },
};
