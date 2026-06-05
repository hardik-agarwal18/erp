import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { taxService } from "./tax.service.js";

export const taxController = {
  createTax: async (req: Request, res: Response) => {
    const tax = await taxService.createTax(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: tax });
  },
  updateTax: async (req: Request, res: Response) => {
    const tax = await taxService.updateTax(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: tax });
  },
  archiveTax: async (req: Request, res: Response) => {
    await taxService.archiveTax(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Tax archived" });
  },
  listTaxes: async (req: Request, res: Response) => {
    const taxes = await taxService.listTaxes(
      req.organization!.id,
      req.query.search as string | undefined,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: taxes });
  },
};
