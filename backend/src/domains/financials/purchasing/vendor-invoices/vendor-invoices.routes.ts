// @ts-nocheck
import { Router } from "express";
import { vendorInvoicesController } from "./vendor-invoices.controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";
import { createVendorInvoiceSchema } from "./vendor-invoices.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission("PURCHASES_CREATE"),
  validate(createVendorInvoiceSchema),
  vendorInvoicesController.create
);

router.get(
  "/",
  requirePermission("PURCHASES_READ"),
  vendorInvoicesController.list
);

router.get(
  "/:id",
  requirePermission("PURCHASES_READ"),
  vendorInvoicesController.getById
);

router.post(
  "/:id/post",
  requirePermission("PURCHASES_CREATE"),
  vendorInvoicesController.postInvoice
);

router.post(
  "/:id/request-override",
  requirePermission("PURCHASES_CREATE"),
  vendorInvoicesController.requestOverride
);

export default router;
