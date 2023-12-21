import { randomUUID } from "crypto";

import ApiError from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { signToken, verifyToken } from "../../lib/jwt.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  EMAIL_VERIFY_TOKEN_EXPIRES_IN,
  PASSWORD_RESET_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "./auth.constants.js";
import {
  AccessTokenPayload,
  EmailTokenPayload,
  PasswordTokenPayload,
  RefreshTokenPayload,
} from "./auth.types.js";

export const generateAccessToken = (
  userId: string,
  context?: Omit<AccessTokenPayload, "sub" | "jti" | "type" | "exp">,
) => {
  const jti = randomUUID();
  const token = signToken(
    {
      sub: userId,
      jti,
      type: "access",
      organizationId: context?.organizationId ?? undefined,
      membershipId: context?.membershipId ?? undefined,
      role: context?.role ?? undefined,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
  return { token, jti };
};

export const generateRefreshToken = (userId: string, sessionId: string) => {
  const payload: RefreshTokenPayload = {
    sub: userId,
    jti: sessionId,
    type: "refresh",
  };

  return signToken(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

export const generateEmailVerificationToken = (
  userId: string,
  tokenId: string,
) => {
  const payload: EmailTokenPayload = {
    sub: userId,
    jti: tokenId,
    type: "email_verify",
  };

  return signToken(payload, env.EMAIL_VERIFY_SECRET, {
    expiresIn: EMAIL_VERIFY_TOKEN_EXPIRES_IN,
  });
};

export const generateEmailToken = generateEmailVerificationToken;

export const generatePasswordResetToken = (userId: string, tokenId: string) => {
  const payload: PasswordTokenPayload = {
    sub: userId,
    jti: tokenId,
    type: "password_reset",
  };

  return signToken(payload, env.PASSWORD_RESET_SECRET, {
    expiresIn: PASSWORD_RESET_TOKEN_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = verifyToken<AccessTokenPayload>(token, env.JWT_ACCESS_SECRET);

    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid access token");
    }

    return payload;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, "Invalid access token");
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = verifyToken<RefreshTokenPayload>(token, env.JWT_REFRESH_SECRET);

    if (payload.type !== "refresh") {
      throw new ApiError(401, "Invalid refresh token");
    }

    return payload;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, "Invalid refresh token");
  }
};
