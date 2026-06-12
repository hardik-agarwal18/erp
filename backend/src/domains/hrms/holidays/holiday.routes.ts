
import { Router } from "express";
import { holidayController } from "./holiday.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);

router.post("/", requirePermission(('holidays.manage' as any)), holidayController.createHoliday);
router.get("/", requirePermission(('holidays.manage' as any)), holidayController.getHolidays);
router.get("/:id", requirePermission(('holidays.manage' as any)), holidayController.getHolidayById);
router.patch("/:id", requirePermission(('holidays.manage' as any)), holidayController.updateHoliday);
router.delete("/:id", requirePermission(('holidays.manage' as any)), holidayController.deleteHoliday);

export { router as holidayRoutes };
