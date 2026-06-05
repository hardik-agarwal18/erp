import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { transactionService } from "./transaction.service.js";

export const transactionController = {
  listTransactions: async (req: Request, res: Response) => {
    const transactions = await transactionService.listTransactions(
      req.organization!.id,
      { type: req.query.type as string | undefined },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: transactions });
  },
  getTransaction: async (req: Request, res: Response) => {
    const transaction = await transactionService.getTransaction(
      req.organization!.id,
      req.params.id,
    );
    sendSuccess(res, { statusCode: 200, data: transaction });
  },
};
