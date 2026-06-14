
import { Router } from "express";
import { vendorInvoicesController } from "./vendor-invoices.controller.js";
import { vendorPaymentsController } from "./vendor-payments.controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { createVendorInvoiceSchema } from "./vendor-invoices.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  validate(createVendorInvoiceSchema),
  vendorInvoicesController.create
);

router.get(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.list
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.getById
);

router.get(
  "/:id/match-summary",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.getMatchSummary
);

router.post(
  "/:id/post",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorInvoicesController.postInvoice
);

router.post(
  "/:id/request-override",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorInvoicesController.requestOverride
);

router.post(
  "/:id/payments",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorPaymentsController.createPayment
);

router.get(
  "/:id/payments",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorPaymentsController.listPayments
);

export default router;

