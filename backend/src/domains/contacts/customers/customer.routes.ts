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
import { customerController } from "./customer.controller.js";
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from "./customer.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.CUSTOMERS_CREATE),
  validate(createCustomerSchema),
  asyncHandler(customerController.createCustomer),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  validate(listCustomersSchema),
  asyncHandler(customerController.listCustomers),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.CUSTOMERS_UPDATE),
  validate(updateCustomerSchema),
  asyncHandler(customerController.updateCustomer),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  validate(customerIdParamSchema),
  asyncHandler(customerController.getCustomerById),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.CUSTOMERS_UPDATE),
  validate(customerIdParamSchema),
  asyncHandler(customerController.archiveCustomer),
);
router.get(
  "/:id/ledger",
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  validate(customerIdParamSchema),
  asyncHandler(customerController.getLedger),
);

export default router;
