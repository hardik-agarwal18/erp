
import { Request } from "express";
import { createHash } from "crypto";

import { env } from "../../../config/env.js";

export const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const getRequestMetadata = (req: Request) => {
  return {
    device: req.get("user-agent") ?? "unknown",
    ipAddress: req.ip,
  };
};

export const buildVerificationUrl = (token: string) => {
  return `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
};

export const buildPasswordResetUrl = (token: string) => {
  return `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
};

export const buildInvitationUrl = (token: string) => {
  return `${env.APP_URL}/accept-invitation?token=${encodeURIComponent(token)}`;
};
