// @ts-nocheck
import { Router } from "express";

import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { invoiceController } from "./invoice.controller.js";
import {
  createInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesSchema,
  updateInvoiceSchema,
  sendInvoiceEmailSchema,
} from "./invoice.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.SALES_CREATE),
  validate(createInvoiceSchema),
  asyncHandler(invoiceController.createInvoice),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.SALES_VIEW),
  validate(listInvoicesSchema),
  asyncHandler(invoiceController.listInvoices),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.SALES_VIEW),
  validate(invoiceIdParamSchema),
  asyncHandler(invoiceController.getInvoice),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.SALES_UPDATE),
  validate(updateInvoiceSchema),
  asyncHandler(invoiceController.updateInvoice),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.SALES_DELETE),
  validate(invoiceIdParamSchema),
  asyncHandler(invoiceController.deleteInvoice),
);
router.get(
  "/:id/pdf",
  requirePermission(PERMISSIONS.SALES_EXPORT),
  validate(invoiceIdParamSchema),
  asyncHandler(invoiceController.exportPdf),
);
router.post(
  "/:id/send",
  requirePermission(PERMISSIONS.SALES_SEND),
  validate(sendInvoiceEmailSchema),
  asyncHandler(invoiceController.sendEmail),
);
router.get(
  "/:id/email-history",
  requirePermission(PERMISSIONS.SALES_VIEW),
  validate(invoiceIdParamSchema),
  asyncHandler(invoiceController.getEmailHistory),
);

export default router;
