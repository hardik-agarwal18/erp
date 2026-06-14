import { Request, Response } from "express";
import { claimsService } from "./claims.service.js";
import { ExpenseClaimStatus } from "./claims.validators.js";

export const claimsController = {
  submitClaim: async (req: Request, res: Response) => {
    const claim = await claimsService.submitClaim(
      req.organization!.id,
      req.user!.id, // member doesn't have employeeId, using user id or we should fetch employeeId
      req.body
    );
    res.status(201).json({ data: claim });
  },

  listClaims: async (req: Request, res: Response) => {
    const canManage = req.user!.role === "ADMIN" || req.user!.role === "HR_MANAGER" || req.user!.role === "MANAGER"; 
    const employeeId = canManage ? undefined : req.user!.id; // Using user.id as employeeId placeholder
    const status = req.query.status as ExpenseClaimStatus | undefined;

    const claims = await claimsService.listClaims(req.organization!.id, employeeId, status);
    res.status(200).json({ data: claims });
  },

  getClaim: async (req: Request, res: Response) => {
    const claim = await claimsService.getClaim(req.params.id as string, req.organization!.id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    res.status(200).json({ data: claim });
  },

  updateStatus: async (req: Request, res: Response) => {
    const { status } = req.body;
    const claim = await claimsService.updateStatus(
      req.params.id as string,
      req.organization!.id,
      req.user!.id,
      status as ExpenseClaimStatus
    );
    res.status(200).json({ data: claim });
  }
};

