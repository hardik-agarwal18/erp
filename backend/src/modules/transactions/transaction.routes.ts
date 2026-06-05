import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
import { transactionController } from "./transaction.controller.js";
import { listTransactionsSchema } from "./transaction.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get(
  "/",
  requirePermission(PERMISSIONS.TRANSACTIONS_VIEW),
  validate(listTransactionsSchema),
  asyncHandler(transactionController.listTransactions),
);

export default router;
