import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { customerController } from "../../../src/modules/customers/customer.controller.js";
import { customerService } from "../../../src/modules/customers/customer.service.js";

jest.mock("../../../src/modules/customers/customer.service.js");

describe("customerController", () => {
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

  it("should create customer", async () => {
    req.body = { name: "Test Cust" };
    (customerService.createCustomer as jest.Mock).mockResolvedValue({ id: "c1", name: "Test Cust" });

    await customerController.createCustomer(req as Request, res as Response);

    expect(customerService.createCustomer).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "c1", name: "Test Cust" } }));
  });

  it("should update customer", async () => {
    req.params = { id: "c1" };
    req.body = { name: "Updated" };
    (customerService.updateCustomer as jest.Mock).mockResolvedValue({ id: "c1", name: "Updated" });

    await customerController.updateCustomer(req as Request, res as Response);

    expect(customerService.updateCustomer).toHaveBeenCalledWith("o1", "u1", "c1", req.body);
  });

  it("should archive customer", async () => {
    req.params = { id: "c1" };

    await customerController.archiveCustomer(req as Request, res as Response);

    expect(customerService.archiveCustomer).toHaveBeenCalledWith("o1", "u1", "c1");
  });

  it("should list customers", async () => {
    req.query = { search: "test", page: "1" };
    (customerService.listCustomers as jest.Mock).mockResolvedValue({ data: [{ id: "c1" }], meta: {} });

    await customerController.listCustomers(req as Request, res as Response);

    expect(customerService.listCustomers).toHaveBeenCalledWith("o1", { search: "test" }, req.query);
  });

  it("should get ledger", async () => {
    req.params = { id: "c1" };
    (customerService.getLedger as jest.Mock).mockResolvedValue({ invoices: [] });

    await customerController.getLedger(req as Request, res as Response);

    expect(customerService.getLedger).toHaveBeenCalledWith("o1", "c1");
  });
});
