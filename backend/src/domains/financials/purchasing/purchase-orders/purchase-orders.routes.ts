
import { Router } from "express";
import { purchaseOrdersController } from "./purchase-orders.controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { createPurchaseOrderSchema } from "./purchase-orders.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  validate(createPurchaseOrderSchema),
  purchaseOrdersController.create
);

router.get(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  purchaseOrdersController.list
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  purchaseOrdersController.getById
);

router.post(
  "/:id/submit-approval",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  purchaseOrdersController.submitForApproval
);

export default router;
