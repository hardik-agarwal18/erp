import { requireAuth } from '../../../shared/middleware/auth.middleware.js';
import { validateRequest } from '../../../shared/middleware/validation.middleware.js';

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

router.use(requireAuth as any);

router.get("/", (validateRequest as any)(getBatchesSchema), batchController.list);
router.get("/expiring", (validateRequest as any)(getExpiringBatchesSchema), batchController.listExpiring);
router.get("/expired", (validateRequest as any)(getExpiredBatchesSchema), batchController.listExpired);
router.get("/:id", batchController.getById);
router.get("/:id/inventory", batchController.getBatchInventory);
router.get("/:id/movements", (validateRequest as any)(getBatchMovementsSchema), batchController.getBatchMovements);
router.get("/:id/traceability", batchController.getBatchTraceability);

export default router;
