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
