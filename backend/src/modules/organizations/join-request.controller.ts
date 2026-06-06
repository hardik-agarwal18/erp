import { Request, Response } from "express";
import { joinRequestService } from "./join-request.service.js";

export const joinRequestController = {
  createJoinRequest: async (req: Request, res: Response) => {
    const { joinCode, message } = req.body;
    const request = await joinRequestService.createJoinRequest(
      req.user!.id,
      joinCode,
      message
    );
    res.status(201).json({ data: request });
  },

  listJoinRequests: async (req: Request, res: Response) => {
    const requests = await joinRequestService.listJoinRequests(req.params.id);
    res.status(200).json({ data: requests });
  },

  approveJoinRequest: async (req: Request, res: Response) => {
    const request = await joinRequestService.approveJoinRequest(
      req.params.id,
      req.params.requestId,
      req.user!.id
    );
    res.status(200).json({ data: request });
  },

  rejectJoinRequest: async (req: Request, res: Response) => {
    const request = await joinRequestService.rejectJoinRequest(
      req.params.id,
      req.params.requestId,
      req.user!.id
    );
    res.status(200).json({ data: request });
  },
};
