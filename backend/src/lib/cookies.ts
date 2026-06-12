import { CookieOptions, Response } from "express";

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
const getBaseCookieOptions = (): CookieOptions => ({
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
});

const getRefreshCookieOptions = (): CookieOptions => ({
  ...getBaseCookieOptions(),
  httpOnly: true,
  path: "/api/v1/auth",
});

const getCsrfCookieOptions = (): CookieOptions => ({
  ...getBaseCookieOptions(),
  httpOnly: false,
  path: "/",
});

export const setAuthCookies = (
  res: Response,
  refreshToken: string,
  csrfToken: string,
) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    ...getCsrfCookieOptions(),
    maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions());
};
