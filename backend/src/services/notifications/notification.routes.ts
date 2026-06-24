import { Router, Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../middleware/tenant.middleware.js";

export const notificationController = {
  listUserNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const userId = req.user!.id;
      const result = await notificationService.listUserNotifications(organizationId, userId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const userId = req.user!.id;
      const { notificationIds } = req.body;
      const result = await notificationService.markAsRead(organizationId, userId, notificationIds);
      res.json({ message: "Notifications marked as read", count: result.count });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(organizationId, userId);
      res.json({ message: "All notifications marked as read", count: result.count });
    } catch (error) {
      next(error);
    }
  },
};

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get("/", notificationController.listUserNotifications);
router.post("/mark-read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);

export default router;
