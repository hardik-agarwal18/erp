
import { Router } from "express";
import { leavesController } from "./leaves.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { applyForLeaveSchema } from "./leaves.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission("LEAVES_CREATE"),
  validate(applyForLeaveSchema),
  leavesController.applyForLeave
);

router.post(
  "/:id/submit-approval",
  requirePermission("LEAVES_CREATE"),
  leavesController.submitForApproval
);

router.get(
  "/",
  requirePermission("LEAVES_READ"),
  leavesController.listApplications
);

router.get(
  "/:id",
  requirePermission("LEAVES_READ"),
  leavesController.getApplicationById
);

export default router;
