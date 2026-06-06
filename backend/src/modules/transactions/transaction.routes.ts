import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { transactionController } from "./transaction.controller.js";
import { listTransactionsSchema } from "./transaction.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get(
  "/",
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  validate(listTransactionsSchema),
  asyncHandler(transactionController.listTransactions),
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  asyncHandler(transactionController.getTransaction),
);

export default router;
