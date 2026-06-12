
import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { serialNumberController } from "./serial-number.controller.js";
import { getSerialNumbersSchema } from "./serial-number.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.get("/", validate(getSerialNumbersSchema), serialNumberController.list);
router.get("/lookup/:serial", serialNumberController.lookupBySerial);
router.get("/:id", serialNumberController.getById);
router.get("/:id/traceability", serialNumberController.getTraceability);

export default router;
