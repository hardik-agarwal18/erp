
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { challanService } from "./delivery-challan.service.js";

export const challanController = {
  create: async (req: Request, res: Response) => {
    const payload = {
      ...req.body,
      deliveryDate: new Date(req.body.deliveryDate),
    };
    const challan = await challanService.create(
      req.organization!.id,
      req.user!.id,
      payload
    );
    sendSuccess(res, { statusCode: 201, data: challan });
  },

  dispatch: async (req: Request, res: Response) => {
    const result = await challanService.dispatch(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },

  getById: async (req: Request, res: Response) => {
    const challan = await challanService.getById(req.params.id as string, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: challan });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as any,
      godownId: req.query.godownId as string | undefined,
      customerId: req.query.customerId as string | undefined,
    };
    const result = await challanService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
