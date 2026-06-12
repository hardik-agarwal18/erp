
import { NextFunction, Request, Response } from "express";

import ApiError from "../../../utils/ApiError.js";
import { CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth.constants.js";

export const requireRefreshToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.cookies?.[REFRESH_COOKIE_NAME]) {
    return next(new ApiError(401, "Refresh token missing"));
  }

  const csrfHeader = req.headers["x-csrf-token"] as string | undefined;
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return next(new ApiError(403, "Invalid CSRF token"));
  }

  return next();
};
