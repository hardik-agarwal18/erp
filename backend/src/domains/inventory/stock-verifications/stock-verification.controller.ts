
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { verificationService } from "./stock-verification.service.js";

export const verificationController = {
  create: async (req: Request, res: Response) => {
    const payload = {
      ...req.body,
      scheduledDate: new Date(req.body.scheduledDate),
    };
    const verification = await verificationService.create(
      req.organization!.id,
      req.user!.id,
      payload
    );
    sendSuccess(res, { statusCode: 201, data: verification });
  },

  complete: async (req: Request, res: Response) => {
    const result = await verificationService.complete(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },

  getById: async (req: Request, res: Response) => {
    const verification = await verificationService.getById(req.params.id as string, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: verification });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as any,
      godownId: req.query.godownId as string | undefined,
    };
    const result = await verificationService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
