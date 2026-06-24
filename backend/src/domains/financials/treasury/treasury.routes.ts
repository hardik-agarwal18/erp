import { Router } from "express";
import asyncHandler from "../../../utils/asyncHandler.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import * as bankingController from "./treasury.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// --- Dashboard ---
router.get("/dashboard", asyncHandler(bankingController.getTreasuryDashboard));
router.get("/alerts", asyncHandler(bankingController.getTreasuryAlerts));
router.get("/activity", asyncHandler(bankingController.getTreasuryActivity));

// Bank Accounts
router.post("/accounts", asyncHandler(bankingController.createBankAccount));
router.get("/accounts", asyncHandler(bankingController.listBankAccounts));
router.get("/accounts/:id", asyncHandler(bankingController.getBankAccountById));
router.patch("/accounts/:id", asyncHandler(bankingController.updateBankAccount));
router.post("/accounts/:id/freeze", asyncHandler(bankingController.freezeBankAccount));
router.post("/accounts/:id/close", asyncHandler(bankingController.closeBankAccount));

// Bank Transactions
router.post("/transactions", asyncHandler(bankingController.createBankTransaction));
router.get("/transactions", asyncHandler(bankingController.listBankTransactions));

// Transfers
router.post("/transfers", asyncHandler(bankingController.createTreasuryTransfer));
router.get("/transfers", asyncHandler(bankingController.listTreasuryTransfers));
router.post("/transfers/:id/reverse", asyncHandler(bankingController.reverseTreasuryTransfer));

// Cash Counts
import * as cashCountsController from "./cash-counts/cash-counts.controller.js";
router.post("/cash-counts", asyncHandler(cashCountsController.createCashCount));
router.get("/cash-counts", asyncHandler(cashCountsController.listCashCounts));
router.get("/cash-counts/:id", asyncHandler(cashCountsController.getCashCountById));
router.post("/cash-counts/:id/post", asyncHandler(cashCountsController.postCashCount));
router.post("/cash-counts/:id/void", asyncHandler(cashCountsController.voidCashCount));
// Advances
import { advancesController } from "./advances/advances.controller.js";
router.get("/advances/outstanding", asyncHandler(advancesController.getOutstandingSummary));
router.get("/advances/aging", asyncHandler(advancesController.getAgingReport));
router.get("/advances/summary", asyncHandler(advancesController.getOutstandingSummary)); // Alias or separate logic if needed
router.get("/advances/health", asyncHandler(advancesController.getAdvanceHealth));
router.get("/advances/settlements", asyncHandler(advancesController.listSettlements));
router.get("/advances/:id/timeline", asyncHandler(advancesController.getAdvanceTimeline));
router.get("/advances/:id", asyncHandler(advancesController.getAdvanceById));
router.get("/advances", asyncHandler(advancesController.listAdvances));
router.post("/advances", asyncHandler(advancesController.createAdvance));
router.post("/advances/:id/issue", asyncHandler(advancesController.issueAdvance));
router.post("/advances/:id/settle", asyncHandler(advancesController.settleAdvance));
router.post("/advances/:id/reverse", asyncHandler(advancesController.reverseAdvance));
router.post("/advances/:id/void", asyncHandler(advancesController.voidAdvance));
router.post("/advances/settlements/:settlementId/reverse", asyncHandler(advancesController.reverseSettlement));

export default router;
