// @ts-nocheck
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { stockGroupService } from "./stock-group.service.js";

export const stockGroupController = {
  create: async (req: Request, res: Response) => {
    const stockGroup = await stockGroupService.create(
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 201, data: stockGroup });
  },

  update: async (req: Request, res: Response) => {
    const stockGroup = await stockGroupService.update(
      req.params.id,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: stockGroup });
  },

  delete: async (req: Request, res: Response) => {
    await stockGroupService.delete(
      req.params.id,
      req.organization!.id,
      req.user!.id
    );
    sendSuccess(res, { statusCode: 200, message: "Stock group deleted successfully" });
  },

  getById: async (req: Request, res: Response) => {
    const stockGroup = await stockGroupService.getById(req.params.id, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: stockGroup });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: ((((req.query.search as string) as string) as string) as string) as string | undefined,
      parentId: (((req.query.parentId as string) as string) as string) as string | undefined,
    };
    const result = await stockGroupService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
