import { Router } from "express";
import { requirePermission } from "../../../middleware/tenant.middleware.js";
import { governanceController } from "./governance.controller.js";

const router = Router();

router.post("/periods/:id/close", governanceController.closeAccountingPeriod);
router.post("/fiscal-years/:id/close", governanceController.closeFiscalYear);
router.post("/accruals", requirePermission("manage_accounting"), governanceController.processAccruals);
router.post("/reverse/:id", requirePermission("manage_accounting"), governanceController.reverseJournalEntry);

export default router;
