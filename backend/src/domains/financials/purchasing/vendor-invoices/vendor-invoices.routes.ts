import { Router } from "express";
import { vendorInvoicesController } from "./vendor-invoices.controller.js";
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
  vendorInvoicesController.createDraft
);

router.get(
  "/",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.list
);

router.get(
  "/aging",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.getApAging
);

router.get(
  "/statement/:vendorId",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.getVendorStatement
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.PURCHASING_VIEW),
  vendorInvoicesController.getById
);

router.post(
  "/:id/match",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorInvoicesController.performThreeWayMatch
);

router.post(
  "/:id/post",
  requirePermission(PERMISSIONS.PURCHASING_CREATE),
  vendorInvoicesController.postInvoice
);

export default router;
