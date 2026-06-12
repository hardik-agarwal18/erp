
import { Request, Response } from "express";
import { accountingService } from "./accounting.service.js";

export const accountingController = {
  getTrialBalance: async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { startDate, endDate } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const trialBalance = await accountingService.getTrialBalance(organizationId, filters);
    res.json(trialBalance);
  },

  listAccounts: async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const accounts = await accountingService.listAccounts(organizationId);
    res.json(accounts);
  },
};