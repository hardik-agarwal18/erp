
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { journalService } from "./stock-journal.service.js";

export const journalController = {
  create: async (req: Request, res: Response) => {
    const journal = await journalService.create(
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 201, data: journal });
  },

  post: async (req: Request, res: Response) => {
    const result = await journalService.post(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },

  getById: async (req: Request, res: Response) => {
    const journal = await journalService.getById(req.params.id as string, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: journal });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as any,
      godownId: req.query.godownId as string | undefined,
    };
    const result = await journalService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
