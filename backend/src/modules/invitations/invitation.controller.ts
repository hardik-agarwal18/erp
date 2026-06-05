import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { invitationService } from "./invitation.service.js";

export const invitationController = {
  acceptInvitation: async (req: Request, res: Response) => {
    const result = await invitationService.acceptInvitation(
      req.body.token,
      req.body.name,
      req.body.password,
    );

    sendSuccess(res, { statusCode: 200, message: "Invitation accepted",
      data: result, });
  },
};
