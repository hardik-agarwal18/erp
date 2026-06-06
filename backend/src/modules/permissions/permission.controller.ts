import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { permissionService } from "./permission.service.js";

export const permissionController = {
  listPermissions: async (_req: Request, res: Response) => {
    const permissions = await permissionService.listPermissions();
    const formattedPermissions = permissions.map((p) => {
      const [domain, action] = p.name.split(".");
      return {
        permission: p.name,
        domain: domain || "system",
        action: action || "unknown",
      };
    });
    sendSuccess(res, { statusCode: 200, data: formattedPermissions });
  },
};
