import { Router, Request, Response, NextFunction } from "express";
import { rfqService } from "./rfq.service.js";
import { authMiddleware } from "../../../../middleware/auth.middleware.js";
import { tenantContextMiddleware } from "../../../../middleware/tenant.middleware.js";

export const rfqController = {
  createRfq: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await rfqService.createRfq(organizationId, actorUserId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  submitResponse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await rfqService.submitVendorResponse(organizationId, req.params.id as string, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  compareVendors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await rfqService.compareVendors(organizationId, req.params.id as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  awardRfq: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const actorUserId = req.user!.id;
      const result = await rfqService.awardRfq(organizationId, actorUserId, req.params.id as string, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  listRfqs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organization!.id;
      const result = await rfqService.listRfqs(organizationId, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.post("/", rfqController.createRfq);
router.get("/", rfqController.listRfqs);
router.post("/:id/responses", rfqController.submitResponse);
router.get("/:id/compare", rfqController.compareVendors);
router.post("/:id/award", rfqController.awardRfq);

export default router;
