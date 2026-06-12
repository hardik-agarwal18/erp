import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { paymentController } from "../../../src/domains/financials/payments/payment.controller.js";
import { paymentService } from "../../../src/domains/financials/payments/payment.service.js";

jest.mock("../../../src/domains/financials/payments/payment.service.js");

describe("paymentController", () => {
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

  it("should create payment", async () => {
    req.body = { invoiceId: "inv1", amount: 100 };
    (paymentService.createPayment as jest.Mock).mockResolvedValue({ id: "pay1", amount: 100 });

    await paymentController.createPayment(req as Request, res as Response);

    expect(paymentService.createPayment).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "pay1", amount: 100 } }));
  });

  it("should list payments", async () => {
    req.query = { invoiceId: "inv1" };
    (paymentService.listPayments as jest.Mock).mockResolvedValue({ data: [{ id: "pay1" }], meta: {} });

    await paymentController.listPayments(req as Request, res as Response);

    expect(paymentService.listPayments).toHaveBeenCalledWith("o1", "inv1", req.query);
  });
});
