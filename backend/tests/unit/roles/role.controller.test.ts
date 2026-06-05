import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { roleController } from "../../../src/modules/roles/role.controller.js";
import { roleService } from "../../../src/modules/roles/role.service.js";

jest.mock("../../../src/modules/roles/role.service.js");

describe("roleController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      member: { organizationId: "o1" } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should create a role", async () => {
    req.body = { name: "Custom", permissionNames: ["admin.read"] };
    (roleService.createRole as jest.Mock).mockResolvedValue({ id: "r1", name: "Custom" });

    await roleController.createRole(req as Request, res as Response);

    expect(roleService.createRole).toHaveBeenCalledWith("o1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "r1", name: "Custom" } }));
  });

  it("should list roles", async () => {
    (roleService.listRoles as jest.Mock).mockResolvedValue([{ id: "r1" }]);

    await roleController.listRoles(req as Request, res as Response);

    expect(roleService.listRoles).toHaveBeenCalledWith("o1");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: "r1" }] }));
  });

  it("should update a role", async () => {
    req.params = { id: "r1" };
    req.body = { name: "Updated" };
    (roleService.updateRole as jest.Mock).mockResolvedValue({ id: "r1", name: "Updated" });

    await roleController.updateRole(req as Request, res as Response);

    expect(roleService.updateRole).toHaveBeenCalledWith("o1", "r1", req.body);
  });

  it("should delete a role", async () => {
    req.params = { id: "r1" };

    await roleController.deleteRole(req as Request, res as Response);

    expect(roleService.deleteRole).toHaveBeenCalledWith("o1", "r1");
  });
});
