
import { Request, Response } from "express";
import { accountingService } from "./accounting.service.js";
import { agingService } from "./aging.service.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const accountingController = {
  getTrialBalance: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { startDate, endDate } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const trialBalance = await accountingService.getTrialBalance(organizationId, filters);
    res.json({ success: true, data: trialBalance });
  }),

  getProfitAndLoss: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { startDate, endDate } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const pl = await accountingService.getProfitAndLoss(organizationId, filters.startDate, filters.endDate);
    res.json({ success: true, data: pl });
  }),

  getBalanceSheet: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { asOfDate } = req.query;

    const bs = await accountingService.getBalanceSheet(organizationId, asOfDate ? new Date(asOfDate as string) : undefined);
    res.json({ success: true, data: bs });
  }),

  getAccountsReceivableAging: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { asOfDate } = req.query;
    
    const aging = await agingService.getAccountsReceivableAging(organizationId, asOfDate ? new Date(asOfDate as string) : undefined);
    res.json({ success: true, data: aging });
  }),

  getAccountsPayableAging: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { asOfDate } = req.query;
    
    const aging = await agingService.getAccountsPayableAging(organizationId, asOfDate ? new Date(asOfDate as string) : undefined);
    res.json({ success: true, data: aging });
  }),

  listAccounts: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const accounts = await accountingService.listAccounts(organizationId);
    res.json({ success: true, data: accounts });
  }),

  createAccount: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const account = await accountingService.createAccount(organizationId, req.body);
    res.status(201).json({ success: true, data: account });
  }),

  updateAccount: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const account = await accountingService.updateAccount(organizationId, req.params.id as string, req.body);
    res.json({ success: true, data: account });
  }),

  listJournals: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { startDate, endDate, referenceType, accountId, page, limit } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      referenceType: referenceType as string | undefined,
      accountId: accountId as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };

    const journals = await accountingService.listJournals(organizationId, filters);
    res.json({ success: true, ...journals });
  }),

  getJournalById: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const journal = await accountingService.getJournalById(organizationId, req.params.id as string);
    res.json({ success: true, data: journal });
  }),

  postJournal: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const journal = await accountingService.postJournalEntry(organizationId, req.body);
    res.status(201).json({ success: true, data: journal });
  }),

  reverseJournal: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const { reversalDate } = req.body;
    const date = reversalDate ? new Date(reversalDate as string) : undefined;
    const journal = await accountingService.reverseJournalEntry(organizationId, req.params.id as string, date);
    res.status(201).json({ success: true, data: journal });
  }),

  listFiscalYears: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const years = await accountingService.listFiscalYears(organizationId);
    res.json({ success: true, data: years });
  }),

  createFiscalYear: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId as string;
    const year = await accountingService.createFiscalYear(organizationId, req.body);
    res.status(201).json({ success: true, data: year });
  }),
};