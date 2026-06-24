import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { quotationService } from "./quotation.service.js";
import { QuotationRevisionStatus } from "@prisma/client";

export const quotationController = {
  createQuotation: async (req: Request, res: Response) => {
    const quotation = await quotationService.createQuotation(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: quotation });
  },

  getQuotationById: async (req: Request, res: Response) => {
    const quotation = await quotationService.getQuotationById(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: quotation });
  },

  listQuotations: async (req: Request, res: Response) => {
    const quotations = await quotationService.listQuotations(
      req.organization!.id,
      {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        customerId: req.query.customerId as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: quotations });
  },

  createRevision: async (req: Request, res: Response) => {
    const revision = await quotationService.createRevision(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: revision });
  },

  updateRevisionStatus: async (req: Request, res: Response) => {
    const revision = await quotationService.updateRevisionStatus(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.params.revisionId as string,
      req.body.status as QuotationRevisionStatus,
    );
    sendSuccess(res, { statusCode: 200, data: revision });
  },
};
