import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { transactionController } from "../../../src/modules/transactions/transaction.controller.js";
import { transactionService } from "../../../src/modules/transactions/transaction.service.js";

jest.mock("../../../src/modules/transactions/transaction.service.js");

describe("transactionController", () => {
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

  it("should list transactions", async () => {
    req.query = { type: "PAYMENT" };
    (transactionService.listTransactions as jest.Mock).mockResolvedValue({ data: [{ id: "tx1" }], meta: {} });

    await transactionController.listTransactions(req as Request, res as Response);

    expect(transactionService.listTransactions).toHaveBeenCalledWith("o1", { type: "PAYMENT" }, req.query);
  });
});
