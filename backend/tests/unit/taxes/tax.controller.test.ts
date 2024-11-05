import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { taxController } from "../../../src/modules/taxes/tax.controller.js";
import { taxService } from "../../../src/modules/taxes/tax.service.js";

jest.mock("../../../src/modules/taxes/tax.service.js");

describe("taxController", () => {
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

  it("should create tax", async () => {
    req.body = { name: "Test Tax" };
    (taxService.createTax as jest.Mock).mockResolvedValue({ id: "t1", name: "Test Tax" });

    await taxController.createTax(req as Request, res as Response);

    expect(taxService.createTax).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "t1", name: "Test Tax" } }));
  });

  it("should update tax", async () => {
    req.params = { id: "t1" };
    req.body = { name: "Updated" };
    (taxService.updateTax as jest.Mock).mockResolvedValue({ id: "t1", name: "Updated" });

    await taxController.updateTax(req as Request, res as Response);

    expect(taxService.updateTax).toHaveBeenCalledWith("o1", "u1", "t1", req.body);
  });

  it("should archive tax", async () => {
    req.params = { id: "t1" };

    await taxController.archiveTax(req as Request, res as Response);

    expect(taxService.archiveTax).toHaveBeenCalledWith("o1", "u1", "t1");
  });

  it("should list taxes", async () => {
    req.query = { search: "test" };
    (taxService.listTaxes as jest.Mock).mockResolvedValue({ data: [{ id: "t1" }], meta: {} });

    await taxController.listTaxes(req as Request, res as Response);

    expect(taxService.listTaxes).toHaveBeenCalledWith("o1", "test", req.query);
  });
});
