// @ts-nocheck
import { Router } from "express";
import { batchController } from "./batch.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import {
  getBatchesSchema,
  getExpiringBatchesSchema,
  getExpiredBatchesSchema,
  getBatchMovementsSchema
} from "./batch.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", validateRequest(getBatchesSchema), batchController.list);
router.get("/expiring", validateRequest(getExpiringBatchesSchema), batchController.listExpiring);
router.get("/expired", validateRequest(getExpiredBatchesSchema), batchController.listExpired);
router.get("/:id", batchController.getById);
router.get("/:id/inventory", batchController.getBatchInventory);
router.get("/:id/movements", validateRequest(getBatchMovementsSchema), batchController.getBatchMovements);
router.get("/:id/traceability", batchController.getBatchTraceability);

export default router;
