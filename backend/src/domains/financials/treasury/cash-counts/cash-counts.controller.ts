import { Request, Response } from "express";
import { cashCountsService } from "./cash-counts.service.js";

export const createCashCount = async (req: Request, res: Response) => {
  const cashCount = await cashCountsService.createCashCount(
    req.member!.organizationId as string,
    req.user!.id,
    req.body
  );
  res.status(201).json(cashCount);
};

export const listCashCounts = async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.bankAccountId) filters.bankAccountId = req.query.bankAccountId as string;
  if (req.query.status) filters.status = req.query.status as string;

  const cashCounts = await cashCountsService.listCashCounts(req.member!.organizationId as string, filters);
  res.json(cashCounts);
};

export const getCashCountById = async (req: Request, res: Response) => {
  const cashCount = await cashCountsService.getCashCountById(
    req.member!.organizationId as string,
    req.params.id as string
  );
  res.json(cashCount);
};

export const postCashCount = async (req: Request, res: Response) => {
  const cashCount = await cashCountsService.postCashCount(
    req.member!.organizationId as string,
    req.params.id as string,
    req.user!.id
  );
  res.json(cashCount);
};

export const voidCashCount = async (req: Request, res: Response) => {
  const cashCount = await cashCountsService.voidCashCount(
    req.member!.organizationId as string,
    req.params.id as string,
    req.user!.id
  );
  res.json(cashCount);
};
