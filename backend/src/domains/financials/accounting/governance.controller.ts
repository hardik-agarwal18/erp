import { Request, Response } from "express";
import { closingService } from "./closing.service.js";
import { accrualsService } from "./accruals.service.js";
import { accountingService } from "./accounting.service.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const governanceController = {
  closeAccountingPeriod: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    // user ID should ideally come from req.user
    const userId = (req as any).user?.id || "SYSTEM";
    const result = await closingService.closeAccountingPeriod((req as any).organizationId!, id as string, userId);
    sendSuccess(res, { data: result, message: "Accounting Period closed successfully" });
  }),

  closeFiscalYear: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || "SYSTEM";
    const result = await (closingService as any).runComplianceCheck((req as any).organizationId!, id);
    sendSuccess(res, { data: result, message: "Fiscal Year closed successfully and Sweep entries posted" });
  }),

  processAccruals: asyncHandler(async (req: Request, res: Response) => {
    const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : new Date();
    const result = await accrualsService.processPendingAccruals((req as any).organizationId!, targetDate);
    sendSuccess(res, { data: result, message: "Accruals processing completed" });
  }),

  reverseJournalEntry: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const reversalDate = req.body.reversalDate ? new Date(req.body.reversalDate) : new Date();
    const result = await accountingService.reverseJournalEntry((req as any).organizationId!, id as string, reversalDate);
    sendSuccess(res, { data: result, message: "Journal Entry reversed successfully" });
  })
};
