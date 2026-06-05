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
    const role = await roleService.updateRole(
      req.member!.organizationId,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, message: "Role updated", data: role });
  },
  deleteRole: async (req: Request, res: Response) => {
    await roleService.deleteRole(
      req.member!.organizationId,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Role deleted" });
  },
};
