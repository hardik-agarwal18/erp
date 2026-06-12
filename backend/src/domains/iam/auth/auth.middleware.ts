// @ts-nocheck
import { NextFunction, Request, Response } from "express";

import ApiError from "../../../utils/ApiError.js";
import { REFRESH_COOKIE_NAME } from "./auth.constants.js";

export const requireRefreshToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.cookies?.[REFRESH_COOKIE_NAME]) {
    return next(new ApiError(401, "Refresh token missing"));
  }

  const csrf = req.headers["x-csrf-token"] as string | undefined;

  if (!csrf) {
    return next(new ApiError(403, "CSRF token missing"));
  }

  return next();
};
