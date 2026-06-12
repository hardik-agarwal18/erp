// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { serialNumberService } from "./serial-number.service.js";

export const serialNumberController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = req.query as any;
      const result = await serialNumberService.list(req.organization!.id, filters, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await serialNumberService.getById(req.params.id as string, req.organization!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  lookupBySerial: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await serialNumberService.lookupBySerial(req.params.serial as string, req.organization!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getTraceability: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await serialNumberService.getTraceability(req.params.id as string, req.organization!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
