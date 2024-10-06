import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { permissionController } from "../../../src/modules/permissions/permission.controller.js";
import { permissionService } from "../../../src/modules/permissions/permission.service.js";

jest.mock("../../../src/modules/permissions/permission.service.js");

describe("permissionController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should list permissions", async () => {
    const mockPermissions = [{ id: "p1", name: "admin.full" }];
    (permissionService.listPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    await permissionController.listPermissions(req as Request, res as Response);

    expect(permissionService.listPermissions).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ permission: "admin.full", domain: "admin", action: "full" }] }));
  });
});
