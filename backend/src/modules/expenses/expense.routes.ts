import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
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
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  validate(createExpenseSchema),
  asyncHandler(expenseController.createExpense),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  validate(listExpensesSchema),
  asyncHandler(expenseController.listExpenses),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  asyncHandler(expenseController.getExpenseById),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  asyncHandler(expenseController.updateExpense),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  asyncHandler(expenseController.deleteExpense),
);

export default router;
