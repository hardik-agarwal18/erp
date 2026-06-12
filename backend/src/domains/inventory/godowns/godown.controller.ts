
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { godownService } from "./godown.service.js";

export const godownController = {
  create: async (req: Request, res: Response) => {
    const godown = await godownService.create(
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 201, data: godown });
  },

  update: async (req: Request, res: Response) => {
    const godown = await godownService.update(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: godown });
  },

  delete: async (req: Request, res: Response) => {
    await godownService.delete(
      req.params.id as string,
      req.organization!.id,
      req.user!.id
    );
    sendSuccess(res, { statusCode: 200, message: "Godown deleted successfully" });
  },

  getById: async (req: Request, res: Response) => {
    const godown = await godownService.getById(req.params.id as string, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: godown });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string | undefined,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
    };
    const result = await godownService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
