import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { vendorController } from "../../../src/modules/vendors/vendor.controller.js";
import { vendorService } from "../../../src/modules/vendors/vendor.service.js";

jest.mock("../../../src/modules/vendors/vendor.service.js");

describe("vendorController", () => {
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

  it("should create vendor", async () => {
    req.body = { name: "Test Vendor" };
    (vendorService.createVendor as jest.Mock).mockResolvedValue({ id: "v1", name: "Test Vendor" });

    await vendorController.createVendor(req as Request, res as Response);

    expect(vendorService.createVendor).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "v1", name: "Test Vendor" } }));
  });

  it("should update vendor", async () => {
    req.params = { id: "v1" };
    req.body = { name: "Updated" };
    (vendorService.updateVendor as jest.Mock).mockResolvedValue({ id: "v1", name: "Updated" });

    await vendorController.updateVendor(req as Request, res as Response);

    expect(vendorService.updateVendor).toHaveBeenCalledWith("o1", "u1", "v1", req.body);
  });

  it("should archive vendor", async () => {
    req.params = { id: "v1" };

    await vendorController.archiveVendor(req as Request, res as Response);

    expect(vendorService.archiveVendor).toHaveBeenCalledWith("o1", "u1", "v1");
  });

  it("should list vendors", async () => {
    req.query = { search: "test" };
    (vendorService.listVendors as jest.Mock).mockResolvedValue({ data: [{ id: "v1" }], meta: {} });

    await vendorController.listVendors(req as Request, res as Response);

    expect(vendorService.listVendors).toHaveBeenCalledWith("o1", { search: "test" }, req.query);
  });

  it("should get ledger", async () => {
    req.params = { id: "v1" };
    (vendorService.getLedger as jest.Mock).mockResolvedValue({ purchases: [] });

    await vendorController.getLedger(req as Request, res as Response);

    expect(vendorService.getLedger).toHaveBeenCalledWith("o1", "v1");
  });
});
