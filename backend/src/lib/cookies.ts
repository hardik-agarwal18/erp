// @ts-nocheck
import { Response } from "express";

import { env } from "../config/env.js";
import {
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../domains/iam/auth/auth.constants.js";

const isProduction = env.NODE_ENV === "production";

export const setAuthCookies = (
  res: Response,
  refreshToken: string,
  csrfToken: string,
) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
    path: "/api/v1/auth",
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
    path: "/",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/" });
};
