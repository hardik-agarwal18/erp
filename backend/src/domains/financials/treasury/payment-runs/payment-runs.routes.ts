import { Router } from "express";
import { paymentRunsController } from "./payment-runs.controller.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get(
  "/suggestions",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  paymentRunsController.getSuggestions
);

router.post(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  paymentRunsController.createPaymentBatch
);

router.post(
  "/:id/submit",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  paymentRunsController.submitForApproval
);

router.post(
  "/:id/execute",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  paymentRunsController.executePaymentBatch
);

router.get(
  "/:id/bank-file",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  paymentRunsController.generateBankFile
);

export default router;
