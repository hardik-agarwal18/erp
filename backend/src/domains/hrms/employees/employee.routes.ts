
import { Router } from "express";
import { employeeController } from "./employee.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";
import { shiftController } from "../shifts/shift.controller.js";

const router = Router();

router.use(authMiddleware);

// ----------------------------------------------------
// EMPLOYEES
// ----------------------------------------------------
router.post(
  "/",
  requirePermission("EMPLOYEES_CREATE"),
  employeeController.createEmployee
);
router.get(
  "/",
  requirePermission("EMPLOYEES_VIEW"),
  employeeController.listEmployees
);
router.get(
  "/:id",
  requirePermission("EMPLOYEES_VIEW"),
  employeeController.getEmployee
);
router.put(
  "/:id",
  requirePermission("EMPLOYEES_EDIT"),
  employeeController.updateEmployee
);
router.delete(
  "/:id",
  requirePermission("EMPLOYEES_DELETE"),
  employeeController.deleteEmployee
);
router.get(
  "/:id/hierarchy",
  requirePermission("EMPLOYEES_VIEW"),
  employeeController.getEmployeeHierarchy
);

export default router;
