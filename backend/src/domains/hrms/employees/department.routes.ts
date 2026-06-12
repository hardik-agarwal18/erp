
import { Router } from "express";
import { employeeController } from "./employee.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  requirePermission("DEPARTMENTS_MANAGE"),
  employeeController.createDepartment
);
router.get(
  "/",
  requirePermission("EMPLOYEES_VIEW"), // Viewing departments is usually tied to viewing employees or a base permission
  employeeController.listDepartments
);
router.put(
  "/:id",
  requirePermission("DEPARTMENTS_MANAGE"),
  employeeController.updateDepartment
);
router.delete(
  "/:id",
  requirePermission("DEPARTMENTS_MANAGE"),
  employeeController.deleteDepartment
);

export default router;
