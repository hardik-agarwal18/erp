// @ts-nocheck
import { Router } from "express";
import { employeeController } from "./employee.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  requirePermission("DESIGNATIONS_MANAGE"),
  employeeController.createDesignation
);
router.get(
  "/",
  requirePermission("EMPLOYEES_VIEW"), // Viewing designations is usually tied to viewing employees
  employeeController.listDesignations
);
router.put(
  "/:id",
  requirePermission("DESIGNATIONS_MANAGE"),
  employeeController.updateDesignation
);
router.delete(
  "/:id",
  requirePermission("DESIGNATIONS_MANAGE"),
  employeeController.deleteDesignation
);

export default router;
