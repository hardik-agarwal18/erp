// @ts-nocheck
import { Router } from "express";
import { purchaseOrdersController } from "./purchase-orders.controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { createPurchaseOrderSchema } from "./purchase-orders.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission("PURCHASES_CREATE"),
  validate(createPurchaseOrderSchema),
  purchaseOrdersController.create
);

router.get(
  "/",
  requirePermission("PURCHASES_READ"),
  purchaseOrdersController.list
);

router.get(
  "/:id",
  requirePermission("PURCHASES_READ"),
  purchaseOrdersController.getById
);

router.post(
  "/:id/submit-approval",
  requirePermission("PURCHASES_CREATE"),
  purchaseOrdersController.submitForApproval
);

export default router;
