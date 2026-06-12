

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

router.use(authMiddleware);

router.get("/", validate(getBatchesSchema), batchController.list);
router.get("/expiring", validate(getExpiringBatchesSchema), batchController.listExpiring);
router.get("/expired", validate(getExpiredBatchesSchema), batchController.listExpired);
router.get("/:id", batchController.getById);
router.get("/:id/inventory", batchController.getBatchInventory);
router.get("/:id/movements", validate(getBatchMovementsSchema), batchController.getBatchMovements);
router.get("/:id/traceability", batchController.getBatchTraceability);

export default router;
