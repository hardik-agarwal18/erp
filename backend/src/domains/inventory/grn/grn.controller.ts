import { Request, Response } from "express";
import { grnService } from "./grn.service.js";

export const grnController = {
  createDraft: async (req: Request, res: Response) => {
    const grn = await grnService.createDraft(
      (req as any).tenant.organizationId,
      (req as any).user.id,
      req.body
    );
    res.status(201).json(grn);
  },

  startInspection: async (req: Request, res: Response) => {
    const grn = await grnService.startInspection(
      req.params.id as string,
      (req as any).tenant.organizationId,
      (req as any).user.id
    );
    res.json(grn);
  },

  recordInspection: async (req: Request, res: Response) => {
    const grn = await grnService.recordInspection(
      req.params.id as string,
      (req as any).tenant.organizationId,
      (req as any).user.id,
      req.body.items
    );
    res.json(grn);
  },

  postGrn: async (req: Request, res: Response) => {
    const grn = await grnService.postGrn(
      req.params.id as string,
      (req as any).tenant.organizationId,
      (req as any).user.id
    );
    res.json(grn);
  },

  getById: async (req: Request, res: Response) => {
    const grn = await grnService.getById(
      req.params.id as string,
      (req as any).tenant.organizationId
    );
    res.json(grn);
  },

  list: async (req: Request, res: Response) => {
    const filters = {
      vendorId: req.query.vendorId as string,
      status: req.query.status as any,
    };
    const result = await grnService.list(
      (req as any).tenant.organizationId,
      filters,
      req.query as Record<string, unknown>
    );
    res.json(result);
  },
};
