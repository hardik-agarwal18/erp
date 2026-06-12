// @ts-nocheck
import { Router } from "express";
import { holidayController } from "./holiday.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/tenant.middleware.js";
import { PERMISSIONS } from "../../../shared/constants/permissions.js";

const router = Router();

router.use(authMiddleware);

router.post("/", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), holidayController.createHoliday);
router.get("/", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), holidayController.getHolidays);
router.get("/:id", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), holidayController.getHolidayById);
router.patch("/:id", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), holidayController.updateHoliday);
router.delete("/:id", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), holidayController.deleteHoliday);

export { router as holidayRoutes };
