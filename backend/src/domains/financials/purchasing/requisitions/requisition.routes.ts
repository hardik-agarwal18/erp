import { Router, Request, Response, NextFunction } from "express";
import { requisitionService } from "./requisition.service.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";

export const requisitionController = {
  createDraft: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await requisitionService.createDraft(organizationId, actorUserId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  submitForApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await requisitionService.submitForApproval(organizationId, actorUserId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  approveRequisition: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const { comments } = req.body;
      const result = await requisitionService.approveRequisition(organizationId, actorUserId, req.params.id as string, comments);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  rejectRequisition: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const { comments } = req.body;
      const result = await requisitionService.rejectRequisition(organizationId, actorUserId, req.params.id as string, comments);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  listRequisitions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await requisitionService.listRequisitions(organizationId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getRequisitionDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await requisitionService.getRequisitionDetails(organizationId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.post("/", requisitionController.createDraft);
router.get("/", requisitionController.listRequisitions);
router.get("/:id", requisitionController.getRequisitionDetails);
router.post("/:id/submit", requisitionController.submitForApproval);
router.post("/:id/approve", requisitionController.approveRequisition);
router.post("/:id/reject", requisitionController.rejectRequisition);

export default router;
