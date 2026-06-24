import { Router } from "express";
import { vendorPaymentsController } from "./vendor-payments.controller.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorPaymentsController.createPayment
);

router.post(
  "/:id/allocate",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorPaymentsController.allocatePayment
);

export default router;
