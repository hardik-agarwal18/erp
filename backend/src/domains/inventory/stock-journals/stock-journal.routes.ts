// @ts-nocheck
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../../shared/middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";
import { journalController } from "./stock-journal.controller.js";
import {
  createJournalSchema,
  listJournalsSchema,
  postJournalSchema,
} from "./stock-journal.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_CREATE),
  validate(createJournalSchema),
  asyncHandler(journalController.create)
);

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  validate(listJournalsSchema),
  asyncHandler(journalController.list)
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_VIEW),
  asyncHandler(journalController.getById)
);

router.post(
  "/:id/post",
  requirePermission(PERMISSIONS.INVENTORY_UPDATE),
  validate(postJournalSchema),
  asyncHandler(journalController.post)
);

export default router;
