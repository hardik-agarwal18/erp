
import { sendSuccess } from "../../../utils/apiResponse.js";
import { Request, Response } from "express";

import { roleService } from "./role.service.js";

export const roleController = {
  createRole: async (req: Request, res: Response) => {
    const role = await roleService.createRole(
      req.member!.organizationId,
      req.member!.userId,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, message: "Role created", data: role });
  },

  listRoles: async (req: Request, res: Response) => {
    const includeArchived = req.query.includeArchived === "true";
    const roles = await roleService.listRoles(req.member!.organizationId, {
      includeArchived,
    });
    sendSuccess(res, { statusCode: 200, data: roles });
  },

  updateRole: async (req: Request, res: Response) => {
    const role = await roleService.updateRole(
      req.member!.organizationId,
      req.params.id as string,
      req.member!.userId,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: role });
  },

  deleteRole: async (req: Request, res: Response) => {
    await roleService.deleteRole(
      req.member!.organizationId,
      req.params.id as string,
      req.member!.userId,
    );
    sendSuccess(res, { statusCode: 200, message: "Role deleted" });
  },

  getRole: async (req: Request, res: Response) => {
    const role = await roleService.getRole(
      req.member!.organizationId,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: role });
  },

  archiveRole: async (req: Request, res: Response) => {
    const role = await roleService.archiveRole(
      req.member!.organizationId,
      req.params.id as string,
      req.member!.userId,
    );
    sendSuccess(res, { statusCode: 200, message: "Role archived", data: role });
  },

  restoreRole: async (req: Request, res: Response) => {
    const role = await roleService.restoreRole(
      req.member!.organizationId,
      req.params.id as string,
      req.member!.userId,
    );
    sendSuccess(res, { statusCode: 200, message: "Role restored", data: role });
  },

  listPermissions: async (_req: Request, res: Response) => {
    const permissions = roleService.listAvailablePermissions();
    sendSuccess(res, { statusCode: 200, data: { items: permissions } });
  },
};
