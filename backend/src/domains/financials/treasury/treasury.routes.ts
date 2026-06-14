import { Router } from "express";
import asyncHandler from "../../../utils/asyncHandler.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import * as bankingController from "./treasury.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// Bank Accounts
router.post("/accounts", asyncHandler(bankingController.createBankAccount));
router.get("/accounts", asyncHandler(bankingController.listBankAccounts));
router.get("/accounts/:id", asyncHandler(bankingController.getBankAccountById));
router.patch("/accounts/:id", asyncHandler(bankingController.updateBankAccount));

// Bank Transactions
router.post("/transactions", asyncHandler(bankingController.createBankTransaction));
router.get("/transactions", asyncHandler(bankingController.listBankTransactions));

export default router;
