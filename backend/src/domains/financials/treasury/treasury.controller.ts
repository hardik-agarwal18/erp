import { Request, Response } from "express";
import { treasuryService } from "./treasury.service.js";

export const createBankAccount = async (req: Request, res: Response) => {
  const account = await treasuryService.createBankAccount(req.member!.organizationId as string, req.body);
  res.status(201).json(account);
};

export const listBankAccounts = async (req: Request, res: Response) => {
  const accounts = await treasuryService.listBankAccounts(req.member!.organizationId as string);
  res.json(accounts);
};

export const getBankAccountById = async (req: Request, res: Response) => {
  const account = await treasuryService.getBankAccountById(req.member!.organizationId as string, req.params.id as string);
  res.json(account);
};

export const updateBankAccount = async (req: Request, res: Response) => {
  const account = await treasuryService.updateBankAccount(req.member!.organizationId as string, req.params.id as string, req.body);
  res.json(account);
};

export const freezeBankAccount = async (req: Request, res: Response) => {
  const account = await treasuryService.freezeBankAccount(req.member!.organizationId as string, req.params.id as string);
  res.json(account);
};

export const closeBankAccount = async (req: Request, res: Response) => {
  const account = await treasuryService.closeBankAccount(req.member!.organizationId as string, req.params.id as string, req.user!.id);
  res.json(account);
};

export const createBankTransaction = async (req: Request, res: Response) => {
  // Convert date string to Date object
  if (req.body.transactionDate) {
    req.body.transactionDate = new Date(req.body.transactionDate);
  } else {
    req.body.transactionDate = new Date();
  }

  const transaction = await treasuryService.createBankTransaction(req.member!.organizationId as string, req.body);
  res.status(201).json(transaction);
};

export const listBankTransactions = async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.bankAccountId) filters.bankAccountId = req.query.bankAccountId as string;
  if (req.query.type) filters.type = req.query.type as string;
  if (req.query.status) filters.status = req.query.status as string;
  if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
  if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

  const transactions = await treasuryService.listBankTransactions(req.member!.organizationId as string, filters);
  res.json(transactions);
};

// --- Transfers ---
import { transfersService } from "./transfers/transfers.service.js";

export const createTreasuryTransfer = async (req: Request, res: Response) => {
  if (req.body.transferDate) {
    req.body.transferDate = new Date(req.body.transferDate);
  } else {
    req.body.transferDate = new Date();
  }

  const transfer = await transfersService.createTreasuryTransfer(
    req.member!.organizationId as string,
    req.user!.id,
    req.body
  );
  res.status(201).json(transfer);
};

export const listTreasuryTransfers = async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.status) filters.status = req.query.status as string;
  if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
  if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

  const transfers = await transfersService.listTreasuryTransfers(req.member!.organizationId as string, filters);
  res.json(transfers);
};

export const reverseTreasuryTransfer = async (req: Request, res: Response) => {
  const { reversalReason } = req.body;
  if (!reversalReason) {
    return res.status(400).json({ message: "reversalReason is required." });
  }

  const transfer = await transfersService.reverseTreasuryTransfer(
    req.member!.organizationId as string,
    req.params.id as string,
    req.user!.id,
    reversalReason
  );
  res.json(transfer);
};

// --- Dashboard ---
import { dashboardService } from "./dashboard/dashboard.service.js";

export const getTreasuryDashboard = async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getTreasuryDashboard(req.member!.organizationId as string);
  res.json(dashboard);
};

export const getTreasuryAlerts = async (req: Request, res: Response) => {
  const alerts = await dashboardService.getTreasuryAlerts(req.member!.organizationId as string);
  res.json(alerts);
};

export const getTreasuryActivity = async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const activity = await dashboardService.getTreasuryActivity(req.member!.organizationId as string, limit);
  res.json(activity);
};
