import { Router } from "express";
import { accountingController } from "./accounting.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// Accounts
router.get("/accounts", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.listAccounts);
router.post("/accounts", requirePermission(PERMISSIONS.FINANCE_CREATE), accountingController.createAccount);
router.patch("/accounts/:id", requirePermission(PERMISSIONS.FINANCE_UPDATE), accountingController.updateAccount);

// Journals
router.get("/journals", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.listJournals);
router.post("/journals", requirePermission(PERMISSIONS.FINANCE_CREATE), accountingController.postJournal);
router.get("/journals/:id", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getJournalById);
router.post("/journals/:id/reverse", requirePermission(PERMISSIONS.FINANCE_UPDATE), accountingController.reverseJournal);

// Fiscal Years
router.get("/fiscal-years", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.listFiscalYears);
router.post("/fiscal-years", requirePermission(PERMISSIONS.FINANCE_CREATE), accountingController.createFiscalYear);

// Reports
router.get("/reports/trial-balance", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getTrialBalance);
router.get("/reports/profit-loss", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getProfitAndLoss);
router.get("/reports/balance-sheet", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getBalanceSheet);
router.get("/reports/aging/ar", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getAccountsReceivableAging);
router.get("/reports/aging/ap", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getAccountsPayableAging);

// Backwards compatibility for existing route
router.get("/trial-balance", requirePermission(PERMISSIONS.FINANCE_VIEW), accountingController.getTrialBalance);

export default router;