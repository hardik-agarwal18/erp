import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { expenseService } from "./expense.service.js";

export const expenseController = {
  createExpense: async (req: Request, res: Response) => {
    const expense = await expenseService.createExpense(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: expense });
  },
  listExpenses: async (req: Request, res: Response) => {
    const expenses = await expenseService.listExpenses(
      req.organization!.id,
      {
        category: req.query.category as string | undefined,
        vendorId: req.query.vendorId as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: expenses });
  },
};
