import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { inventoryController } from "../../../src/modules/inventory/inventory.controller.js";
import { inventoryService } from "../../../src/modules/inventory/inventory.service.js";

jest.mock("../../../src/modules/inventory/inventory.service.js");

describe("inventoryController", () => {
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

  it("should list items", async () => {
    req.query = { search: "test" };
    (inventoryService.listItems as jest.Mock).mockResolvedValue({ data: [{ id: "i1" }], meta: {} });

    await inventoryController.listItems(req as Request, res as Response);

    expect(inventoryService.listItems).toHaveBeenCalledWith("o1", { search: "test" }, req.query);
  });

  it("should list movements", async () => {
    req.query = { productId: "p1" };
    (inventoryService.listMovements as jest.Mock).mockResolvedValue({ data: [{ id: "m1" }], meta: {} });

    await inventoryController.listMovements(req as Request, res as Response);

    expect(inventoryService.listMovements).toHaveBeenCalledWith("o1", "p1", req.query);
  });

  it("should adjust stock", async () => {
    req.body = { productId: "p1", quantity: 5 };
    (inventoryService.adjustStock as jest.Mock).mockResolvedValue({ item: { id: "i1" }, movement: { id: "m1" } });

    await inventoryController.adjustStock(req as Request, res as Response);

    expect(inventoryService.adjustStock).toHaveBeenCalledWith("o1", "u1", req.body);
  });

  it("should transfer stock", async () => {
    req.body = { productId: "p1", quantity: 5 };
    (inventoryService.transferStock as jest.Mock).mockResolvedValue({ item: { id: "i1" }, movement: { id: "m1" } });

    await inventoryController.transferStock(req as Request, res as Response);

    expect(inventoryService.transferStock).toHaveBeenCalledWith("o1", "u1", req.body);
  });
});
