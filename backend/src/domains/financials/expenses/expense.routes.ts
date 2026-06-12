
import { Router } from "express";

import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { expenseController } from "./expense.controller.js";
import {
  createExpenseSchema,
  listExpensesSchema,
} from "./expense.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.FINANCE_CREATE),
  validate(createExpenseSchema),
  asyncHandler(expenseController.createExpense),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  validate(listExpensesSchema),
  asyncHandler(expenseController.listExpenses),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  asyncHandler(expenseController.getExpenseById),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.FINANCE_UPDATE),
  asyncHandler(expenseController.updateExpense),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.FINANCE_DELETE),
  asyncHandler(expenseController.deleteExpense),
);

export default router;
