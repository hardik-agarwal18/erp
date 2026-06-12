import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { invoiceController } from "../../../src/domains/financials/invoices/invoice.controller.js";
import { invoiceService } from "../../../src/domains/financials/invoices/invoice.service.js";

jest.mock("../../../src/domains/financials/invoices/invoice.service.js");

describe("invoiceController", () => {
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

  it("should create invoice", async () => {
    req.body = { customerId: "c1", items: [] };
    (invoiceService.createInvoice as jest.Mock).mockResolvedValue({ id: "inv1" });

    await invoiceController.createInvoice(req as Request, res as Response);

    expect(invoiceService.createInvoice).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "inv1" } }));
  });

  it("should update invoice", async () => {
    req.params = { id: "inv1" };
    req.body = { status: "ISSUED" };
    (invoiceService.updateInvoice as jest.Mock).mockResolvedValue({ id: "inv1", status: "ISSUED" });

    await invoiceController.updateInvoice(req as Request, res as Response);

    expect(invoiceService.updateInvoice).toHaveBeenCalledWith("o1", "u1", "inv1", req.body);
  });

  it("should list invoices", async () => {
    req.query = { status: "DRAFT" };
    (invoiceService.listInvoices as jest.Mock).mockResolvedValue({ data: [{ id: "inv1" }], meta: {} });

    await invoiceController.listInvoices(req as Request, res as Response);

    expect(invoiceService.listInvoices).toHaveBeenCalledWith("o1", { status: "DRAFT", search: undefined }, req.query);
  });

  it("should get invoice", async () => {
    req.params = { id: "inv1" };
    (invoiceService.getInvoice as jest.Mock).mockResolvedValue({ id: "inv1" });

    await invoiceController.getInvoice(req as Request, res as Response);

    expect(invoiceService.getInvoice).toHaveBeenCalledWith("o1", "inv1");
  });
});
