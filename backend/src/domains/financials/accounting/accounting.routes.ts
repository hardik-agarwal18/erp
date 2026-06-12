
import { Router } from "express";
import { accountingController } from "./accounting.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/accounts", requirePermission("ACCOUNTING_VIEW"), accountingController.listAccounts);
router.get("/trial-balance", requirePermission("ACCOUNTING_VIEW"), accountingController.getTrialBalance);

export default router;