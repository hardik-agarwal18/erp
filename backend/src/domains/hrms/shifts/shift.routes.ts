
import { Router } from "express";
import { shiftController } from "./shift.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);

// Dashboard metrics (put this before /:id to avoid conflict)
router.get("/dashboard/metrics", requirePermission(PERMISSIONS.SHIFTS_MANAGE), shiftController.getDashboardMetrics);

// Shift CRUD
router.post("/", requirePermission(PERMISSIONS.SHIFTS_MANAGE), shiftController.createShift);
router.get("/", requirePermission(PERMISSIONS.SHIFTS_MANAGE), shiftController.listShifts);
router.patch("/:id", requirePermission(PERMISSIONS.SHIFTS_MANAGE), shiftController.updateShift);
router.delete("/:id", requirePermission(PERMISSIONS.SHIFTS_MANAGE), shiftController.deleteShift);

// Assignments (usually these could be under employees router, but we'll put them here for cleanliness)
// Alternatively we can mount them on /employees/:employeeId/shifts, which makes more RESTful sense.
// To keep things simple, we'll expose the endpoints here but we will also expose them in employee.routes.ts or just rely on these.
// Wait, it's better to expose them here: /api/v1/shifts/assignments/:employeeId
// But let's follow the standard approach.

export default router;
