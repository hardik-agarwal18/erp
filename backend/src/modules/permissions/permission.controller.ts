import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { permissionService } from "./permission.service.js";

export const permissionController = {
  listPermissions: async (_req: Request, res: Response) => {
    const permissions = await permissionService.listPermissions();
    sendSuccess(res, { statusCode: 200, data: permissions });
  },
};
