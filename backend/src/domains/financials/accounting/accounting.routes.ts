// @ts-nocheck
import { Router } from "express";
import { accountingController } from "./accounting.controller.js";
import { requireAuth } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/accounts", requirePermission("ACCOUNTING_VIEW"), accountingController.listAccounts);
router.get("/trial-balance", requirePermission("ACCOUNTING_VIEW"), accountingController.getTrialBalance);

export default router;