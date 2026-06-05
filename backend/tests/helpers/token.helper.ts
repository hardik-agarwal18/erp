import type { Response as SupertestResponse } from "supertest";
import { randomUUID } from "crypto";

import { env } from "../../src/config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../src/modules/auth/auth.tokens.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../../src/modules/auth/auth.types.js";
import { verifyToken } from "../../src/lib/jwt.js";

export const getCookieValue = (
  cookies: string[] | undefined,
  cookieName: string,
) => {
  const match = cookies
    ?.find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.match(new RegExp(`^${cookieName}=([^;]+)`));

  return match?.[1];
};

export const extractAuthCookies = (response: SupertestResponse) => {
  const setCookie = (response.headers["set-cookie"] as string[] | undefined) ?? [];
  return {
    cookieHeader: setCookie.map((cookie) => cookie.split(";")[0]),
    refreshToken: getCookieValue(setCookie, "refreshToken"),
    csrfToken: getCookieValue(setCookie, "csrfToken"),
  };
};

export const decodeAccessToken = (token: string) => {
  return verifyToken<AccessTokenPayload>(token, env.JWT_ACCESS_SECRET);
};

export const decodeRefreshToken = (token: string) => {
  return verifyToken<RefreshTokenPayload>(token, env.JWT_REFRESH_SECRET);
};

export const generateAccessTokenForTest = (
  userId: string,
  context?: {
    organizationId?: string;
    membershipId?: string;
    role?: string;
  },
) => {
  return generateAccessToken(userId, context).token;
};

export const generateRefreshTokenForTest = (
  userId: string,
  sessionId = randomUUID(),
) => {
  return {
    sessionId,
    token: generateRefreshToken(userId, sessionId),
  };
};
