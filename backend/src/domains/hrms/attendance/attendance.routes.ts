// @ts-nocheck
import { Router } from "express";
import { attendanceController } from "./attendance.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { checkInSchema, checkOutSchema, requestAdjustmentSchema } from "./attendance.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/check-in",
  validate(checkInSchema),
  attendanceController.checkIn
);

router.post(
  "/check-out",
  validate(checkOutSchema),
  attendanceController.checkOut
);

router.post(
  "/adjust",
  requirePermission("ATTENDANCE_MANAGE"),
  validate(requestAdjustmentSchema),
  attendanceController.requestAdjustment
);

router.get(
  "/summary",
  requirePermission("ATTENDANCE_READ"),
  attendanceController.getPayrollSummary
);

export default router;
