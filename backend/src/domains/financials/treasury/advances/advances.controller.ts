import { Request, Response } from "express";
import { advancesService } from "./advances.service.js";

export const advancesController = {
  createAdvance: async (req: Request, res: Response) => {
    const advance = await advancesService.createAdvance(req.member!.organizationId as string, req.body);
    res.status(201).json(advance);
  },

  issueAdvance: async (req: Request, res: Response) => {
    const advance = await advancesService.issueAdvance(req.member!.organizationId as string, req.params.id as string);
    res.json(advance);
  },

  settleAdvance: async (req: Request, res: Response) => {
    const advance = await advancesService.settleAdvance(req.member!.organizationId as string, req.params.id as string, req.body);
    res.json(advance);
  },

  reverseAdvance: async (req: Request, res: Response) => {
    const advance = await advancesService.reverseAdvance(req.member!.organizationId as string, req.params.id as string, req.user!.id, req.body.reason);
    res.json(advance);
  },

  reverseSettlement: async (req: Request, res: Response) => {
    const advance = await advancesService.reverseSettlement(req.member!.organizationId as string, req.params.settlementId as string, req.user!.id);
    res.json(advance);
  },

  voidAdvance: async (req: Request, res: Response) => {
    const advance = await advancesService.voidAdvance(req.member!.organizationId as string, req.params.id as string, req.user!.id);
    res.json(advance);
  },

  listAdvances: async (req: Request, res: Response) => {
    const advances = await advancesService.listAdvances(req.member!.organizationId as string, req.query);
    res.json(advances);
  },

  listSettlements: async (req: Request, res: Response) => {
    const settlements = await advancesService.listSettlements(req.member!.organizationId as string, req.query);
    res.json(settlements);
  },

  getAdvanceById: async (req: Request, res: Response) => {
    const advance = await advancesService.getAdvanceById(req.member!.organizationId as string, req.params.id as string);
    res.json(advance);
  },

  getOutstandingSummary: async (req: Request, res: Response) => {
    const summary = await advancesService.getOutstandingSummary(req.member!.organizationId as string);
    res.json(summary);
  },

  getAgingReport: async (req: Request, res: Response) => {
    const aging = await advancesService.getAgingReport(req.member!.organizationId as string);
    res.json(aging);
  },

  getAdvanceHealth: async (req: Request, res: Response) => {
    const health = await advancesService.getAdvanceHealth(req.member!.organizationId as string);
    res.json(health);
  },

  getAdvanceTimeline: async (req: Request, res: Response) => {
    const timeline = await advancesService.getAdvanceTimeline(req.member!.organizationId as string, req.params.id as string);
    res.json(timeline);
  }
};
