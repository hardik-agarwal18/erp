// @ts-nocheck
import { Router } from "express";

import { validate } from "../../../middleware/validate.middleware.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { invitationController } from "./invitation.controller.js";
import { acceptInvitationSchema } from "./invitation.validators.js";

const router = Router();

router.post(
  "/accept",
  validate(acceptInvitationSchema),
  asyncHandler(invitationController.acceptInvitation),
);

export default router;
