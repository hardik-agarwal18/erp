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
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: expenses });
  },
  getExpenseById: async (req: Request, res: Response) => {
    const expense = await expenseService.getExpenseById(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: expense });
  },
  updateExpense: async (req: Request, res: Response) => {
    const expense = await expenseService.updateExpense(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: expense });
  },
  deleteExpense: async (req: Request, res: Response) => {
    await expenseService.deleteExpense(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Expense deleted successfully" });
  },
};
