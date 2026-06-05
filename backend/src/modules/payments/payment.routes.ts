import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/rbac.js";
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
  requirePermission(PERMISSIONS.PAYMENTS_CREATE),
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.PAYMENTS_VIEW),
  validate(listPaymentsSchema),
  asyncHandler(paymentController.listPayments),
);

export default router;
