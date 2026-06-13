
import { Router } from "express";
import { employeeController } from "./employee.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { shiftController } from "../shifts/shift.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

import { PERMISSIONS } from "../../../shared/constants/permissions.js";

// ----------------------------------------------------
// EMPLOYEES
// ----------------------------------------------------
router.get(
  "/dashboard",
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  employeeController.getDashboardMetrics
);
router.post(
  "/",
  requirePermission(PERMISSIONS.MEMBER_UPDATE),
  employeeController.createEmployee
);
router.get(
  "/",
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  employeeController.listEmployees
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  employeeController.getEmployee
);
router.put(
  "/:id",
  requirePermission(PERMISSIONS.MEMBER_UPDATE),
  employeeController.updateEmployee
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
  employeeController.deleteEmployee
);
router.get(
  "/:id/hierarchy",
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  employeeController.getEmployeeHierarchy
);

export default router;
