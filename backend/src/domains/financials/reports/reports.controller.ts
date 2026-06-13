import { Request, Response } from "express";
import { TrialBalanceEngine, TrialBalanceParams } from "./trial-balance.engine.js";
import { BalanceSheetService, PnLService } from "./financial-statements.service.js";
import { FinancialStatementSnapshotService } from "./snapshot.service.js";

function getParams(req: Request): TrialBalanceParams {
  const organizationId = req.user?.organizationId as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const fiscalYearId = req.query.fiscalYearId as string | undefined;

  return { organizationId, startDate, endDate, fiscalYearId };
}

export const reportsController = {
  getTrialBalance: async (req: Request, res: Response) => {
    try {
      const params = getParams(req);
      const result = await TrialBalanceEngine.generate(params);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getBalanceSheet: async (req: Request, res: Response) => {
    try {
      const params = getParams(req);
      const result = await BalanceSheetService.generate(params);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getPnL: async (req: Request, res: Response) => {
    try {
      const params = getParams(req);
      const result = await PnLService.generate(params);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  snapshotReport: async (req: Request, res: Response) => {
    try {
      const params = getParams(req);
      const statementType = req.body.statementType;
      
      if (!['BALANCE_SHEET', 'TRIAL_BALANCE', 'PROFIT_AND_LOSS'].includes(statementType)) {
        return res.status(400).json({ error: 'Invalid statementType' });
      }

      const snapshot = await FinancialStatementSnapshotService.createSnapshot(
        params.organizationId,
        statementType,
        params
      );

      res.status(201).json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getSnapshots: async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const statementType = req.query.statementType as string;
      const snapshots = await FinancialStatementSnapshotService.getSnapshots(organizationId, statementType);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
