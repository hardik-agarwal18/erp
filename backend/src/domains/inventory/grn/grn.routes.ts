import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { grnController } from "./grn.controller.js";
import {
  createGRNSchema,
  listGRNSchema,
} from "./grn.validators.js";
import { z } from "zod";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createGRNSchema),
  asyncHandler(grnController.createDraft)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listGRNSchema),
  asyncHandler(grnController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(grnController.getById)
);

router.post(
  "/:id/inspect/start",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  asyncHandler(grnController.startInspection)
);

const recordInspectionSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      grnItemId: z.string(),
      acceptedQuantity: z.number().min(0),
      rejectedQuantity: z.number().min(0),
      rejectedDisposition: z.enum(['PENDING', 'RETURN_TO_VENDOR', 'REPLACEMENT_REQUESTED', 'SCRAPPED', 'ACCEPTED_AS_IS']).optional(),
      inspectionComments: z.string().optional()
    }))
  })
});

router.post(
  "/:id/inspect/record",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(recordInspectionSchema),
  asyncHandler(grnController.recordInspection)
);

router.post(
  "/:id/post",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  asyncHandler(grnController.postGrn)
);

export default router;
