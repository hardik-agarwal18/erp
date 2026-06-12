import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { expenseController } from "../../../src/domains/financials/expenses/expense.controller.js";
import { expenseService } from "../../../src/domains/financials/expenses/expense.service.js";

jest.mock("../../../src/domains/financials/expenses/expense.service.js");

describe("expenseController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      organization: { id: "o1" } as any,
      user: { id: "u1" } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should create expense", async () => {
    req.body = { amount: 100 };
    (expenseService.createExpense as jest.Mock).mockResolvedValue({ id: "e1", amount: 100 });

    await expenseController.createExpense(req as Request, res as Response);

    expect(expenseService.createExpense).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "e1", amount: 100 } }));
  });

  it("should list expenses", async () => {
    req.query = { category: "Meals" };
    (expenseService.listExpenses as jest.Mock).mockResolvedValue({ data: [{ id: "e1" }], meta: {} });

    await expenseController.listExpenses(req as Request, res as Response);

    expect(expenseService.listExpenses).toHaveBeenCalledWith("o1", { category: "Meals", vendorId: undefined }, req.query);
  });
});
