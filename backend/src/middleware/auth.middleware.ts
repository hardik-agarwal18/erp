
import { NextFunction, Request, Response } from "express";

import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { verifyToken } from "../lib/jwt.js";
import { redisClient } from "../config/redis.js";
import { loggerContext } from "../config/logger.js";
import { AccessTokenPayload } from "../domains/iam/auth/auth.types.js";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken<AccessTokenPayload>(
      token,
      env.JWT_ACCESS_SECRET,
    );

    if (payload.type !== "access") {
      return next(new ApiError(401, "Unauthorized"));
    }

    const blacklisted = await redisClient.get(`blacklist:${payload.jti}`);

    if (blacklisted) {
      return next(new ApiError(401, "Token revoked"));
    }

    req.user = {
      id: payload.sub,
      organizationId: payload.organizationId ?? null,
      membershipId: payload.membershipId ?? null,
      role: payload.role ?? null,
    };
    req.auth = { jti: payload.jti, exp: payload.exp, token };

    const store = loggerContext.getStore();
    if (store) {
      store.set("userId", payload.sub);
    }

    return next();
  } catch {
    return next(new ApiError(401, "Unauthorized"));
  }
};
