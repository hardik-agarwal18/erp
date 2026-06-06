import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { paymentController } from "./payment.controller.js";
import {
  createPaymentSchema,
  listPaymentsSchema,
} from "./payment.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.FINANCE_CREATE),
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  validate(listPaymentsSchema),
  asyncHandler(paymentController.listPayments),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.FINANCE_DELETE),
  asyncHandler(paymentController.deletePayment),
);

export default router;
