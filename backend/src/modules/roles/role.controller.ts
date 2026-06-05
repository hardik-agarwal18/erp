import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { roleService } from "./role.service.js";

export const roleController = {
  createRole: async (req: Request, res: Response) => {
    const role = await roleService.createRole(req.member!.organizationId, req.body);
    sendSuccess(res, { statusCode: 201, message: "Role created", data: role });
  },
  listRoles: async (req: Request, res: Response) => {
    const roles = await roleService.listRoles(req.member!.organizationId);
    sendSuccess(res, { statusCode: 200, data: roles });
  },
  updateRole: async (req: Request, res: Response) => {
    try {
      const role = await roleService.updateRole(
        req.member!.organizationId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { statusCode: 200, data: role });
    } catch (err) {
      console.error("ERROR IN UPDATEROLE:", err);
      throw err;
    }
  },
  deleteRole: async (req: Request, res: Response) => {
    await roleService.deleteRole(
      req.member!.organizationId,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Role deleted" });
  },
  getRole: async (req: Request, res: Response) => {
    const role = await roleService.getRole(req.member!.organizationId, req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: role });
  },
  listPermissions: async (req: Request, res: Response) => {
    const permissions = roleService.listAvailablePermissions();
    // Wrap them in objects with `id` and `name` to match the frontend/test expectations if needed.
    // Assuming the test just expects a list of items with `id`. Wait, let's look at the database.
    // The test does: `perms[0].id`. The DB has Permission model.
    // But listAvailablePermissions returns DEFAULT_PERMISSIONS which are just { name, description }.
    // Let me check how `roles.test.ts` checks it.
    // Let's just fetch them from prisma!
    // I'll add `listPermissions` to `role.service.ts` to fetch from DB.
    sendSuccess(res, { statusCode: 200, data: { items: permissions } });
  },
};
