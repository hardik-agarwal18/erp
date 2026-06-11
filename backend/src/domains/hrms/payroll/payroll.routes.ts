// @ts-nocheck
import { Router } from "express";
import { payrollController } from "./payroll.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission, tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { createSalaryComponentSchema, assignStructureSchema, generatePayrollSchema } from "./payroll.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

// Components
router.post(
  "/components",
  requirePermission("PAYROLL_MANAGE"),
  validate(createSalaryComponentSchema),
  payrollController.createComponent
);

router.get(
  "/components",
  requirePermission("PAYROLL_READ"),
  payrollController.listComponents
);

// Structures
router.post(
  "/structures",
  requirePermission("PAYROLL_MANAGE"),
  validate(assignStructureSchema),
  payrollController.assignStructure
);

router.get(
  "/structures/:employeeId",
  requirePermission("PAYROLL_READ"),
  payrollController.getStructure
);

// Runs
router.post(
  "/runs/generate",
  requirePermission("PAYROLL_RUN"),
  validate(generatePayrollSchema),
  payrollController.generatePayroll
);

router.post(
  "/runs/:id/submit",
  requirePermission("PAYROLL_RUN"),
  payrollController.submitForApproval
);

router.get(
  "/runs/:id",
  requirePermission("PAYROLL_READ"),
  payrollController.getPayrollRun
);

export default router;
