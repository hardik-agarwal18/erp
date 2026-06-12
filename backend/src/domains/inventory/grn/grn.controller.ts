
import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { grnService } from "./grn.service.js";

export const grnController = {
  create: async (req: Request, res: Response) => {
    const payload = {
      ...req.body,
      receivedDate: new Date(req.body.receivedDate),
    };
    const grn = await grnService.create(
      req.organization!.id,
      req.user!.id,
      payload
    );
    sendSuccess(res, { statusCode: 201, data: grn });
  },

  receive: async (req: Request, res: Response) => {
    const result = await grnService.receive(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      req.body
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },

  getById: async (req: Request, res: Response) => {
    const grn = await grnService.getById(req.params.id as string, req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: grn });
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as any,
      godownId: req.query.godownId as string | undefined,
      vendorId: req.query.vendorId as string | undefined,
    };
    const result = await grnService.list(
      req.organization!.id,
      filters,
      req.query
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
