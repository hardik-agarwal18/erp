
import { Response } from "express";

import { env } from "../config/env.js";
import {
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../domains/iam/auth/auth.constants.js";

const isProduction = env.NODE_ENV === "production";

// In production (cross-domain: Vercel → Render), cookies MUST be SameSite=None + Secure.
// SameSite=Strict blocks all cross-site requests, causing logout on every API call.
// In development (same host, different ports), Lax is sufficient.
const sameSite = isProduction ? "none" : "lax";

export const setAuthCookies = (
  res: Response,
  refreshToken: string,
  csrfToken: string,
) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,   // SameSite=none requires Secure=true
    sameSite,
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
    path: "/api/v1/auth",
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
    path: "/",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: "/api/v1/auth",
    secure: isProduction,
    sameSite,
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: "/",
    secure: isProduction,
    sameSite,
  });
};
