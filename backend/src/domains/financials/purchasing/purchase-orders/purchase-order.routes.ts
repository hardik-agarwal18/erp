import { Router, Request, Response, NextFunction } from "express";
import { purchaseOrderService } from "./purchase-order.service.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";

export const purchaseOrderController = {
  createDraft: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await purchaseOrderService.createDraft(organizationId, actorUserId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  revise: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await purchaseOrderService.revise(organizationId, actorUserId, req.params.id as string, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  submitForApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await purchaseOrderService.submitForApproval(organizationId, actorUserId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  approvePO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const { comments } = req.body;
      const result = await purchaseOrderService.approvePO(organizationId, actorUserId, req.params.id as string, comments);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  rejectPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const { comments } = req.body;
      const result = await purchaseOrderService.rejectPO(organizationId, actorUserId, req.params.id as string, comments);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  sendToVendor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await purchaseOrderService.sendToVendor(organizationId, actorUserId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  listPOs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await purchaseOrderService.listPOs(organizationId, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getPODetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await purchaseOrderService.getPODetails(organizationId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.post("/", purchaseOrderController.createDraft);
router.get("/", purchaseOrderController.listPOs);
router.get("/:id", purchaseOrderController.getPODetails);
router.post("/:id/revise", purchaseOrderController.revise);
router.post("/:id/submit", purchaseOrderController.submitForApproval);
router.post("/:id/approve", purchaseOrderController.approvePO);
router.post("/:id/reject", purchaseOrderController.rejectPO);
router.post("/:id/send", purchaseOrderController.sendToVendor);

export default router;
