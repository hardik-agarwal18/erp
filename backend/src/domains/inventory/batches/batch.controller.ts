
import { Request, Response } from "express";
import { batchService } from "./batch.service.js";

export const batchController = {
  list: async (req: Request, res: Response) => {
    const filters = req.query as any;
    const result = await batchService.list(req.user!.organizationId as string, filters, req.query);
    res.json(result);
  },

  listExpiring: async (req: Request, res: Response) => {
    const filters = req.query as any;
    const result = await batchService.listExpiring(req.user!.organizationId as string, filters, req.query);
    res.json(result);
  },

  listExpired: async (req: Request, res: Response) => {
    const result = await batchService.listExpired(req.user!.organizationId as string, req.query);
    res.json(result);
  },

  getById: async (req: Request, res: Response) => {
    const batch = await batchService.getById(req.params.id as string, req.user!.organizationId as string);
    res.json(batch);
  },

  getBatchInventory: async (req: Request, res: Response) => {
    const inventory = await batchService.getBatchInventory(req.params.id as string, req.user!.organizationId as string);
    res.json({ rows: inventory });
  },

  getBatchMovements: async (req: Request, res: Response) => {
    const movements = await batchService.getBatchMovements(req.params.id as string, req.user!.organizationId as string, req.query);
    res.json(movements);
  },

  getBatchTraceability: async (req: Request, res: Response) => {
    const trace = await batchService.getBatchTraceability(req.params.id as string, req.user!.organizationId as string);
    res.json({ rows: trace });
  },
};
