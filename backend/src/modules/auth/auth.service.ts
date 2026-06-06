import { randomUUID } from "crypto";
import { Request } from "express";

import ApiError from "../../utils/ApiError.js";
import { comparePassword, hashPassword } from "../../lib/bcrypt.js";
import { verifyToken } from "../../lib/jwt.js";
import { redisClient } from "../../redis/redisClient.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../services/mail/index.js";
import { AUDIT_ACTIONS, auditService } from "../../services/audit/index.js";
import { env } from "../../config/env.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  EMAIL_VERIFY_TOKEN_EXPIRES_IN,
  PASSWORD_RESET_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "./auth.constants.js";
import { authRepository } from "./auth.repository.js";
import {
  buildPasswordResetUrl,
  buildVerificationUrl,
  getRequestMetadata,
  hashToken,
} from "./auth.utils.js";
import {
  generateAccessToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateRefreshToken,
} from "./auth.tokens.js";
import {
  AccessTokenPayload,
  AuthContext,
  EmailTokenPayload,
  PasswordTokenPayload,
  RefreshTokenPayload,
} from "./auth.types.js";

type RefreshSessionCache = {
  userId: string;
  refreshTokenHash: string;
  csrfTokenHash: string;
  activeOrganizationId: string | null;
};

const refreshSessionKey = (sessionId: string) => `refresh:${sessionId}`;

const storeRefreshSession = async (
  sessionId: string,
  data: RefreshSessionCache,
) => {
  await redisClient.set(refreshSessionKey(sessionId), JSON.stringify(data), {
    EX: REFRESH_TOKEN_EXPIRES_IN,
  });
};

const getRefreshSessionCache = async (sessionId: string) => {
  const stored = await redisClient.get(refreshSessionKey(sessionId));
  return stored ? (JSON.parse(stored) as RefreshSessionCache) : null;
};

const deleteRefreshSessionCache = async (sessionId: string) => {
  await redisClient.del(refreshSessionKey(sessionId));
};

const blacklistAccessToken = async (jti: string, exp?: number) => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp ? exp - now : ACCESS_TOKEN_EXPIRES_IN;

  if (ttl > 0) {
    await redisClient.set(`blacklist:${jti}`, "1", { EX: ttl });
  }
};

const serializeWorkspace = (
  membership: Awaited<
    ReturnType<typeof authRepository.listUserMemberships>
  >[number],
) => {
  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    logo: membership.organization.logo,
    ownerId: membership.organization.ownerId,
    membershipId: membership.id,
    roleId: membership.roleId,
    role: membership.role.name,
    createdAt: membership.organization.createdAt,
  };
};

const resolveAccessContext = async (
  userId: string,
  organizationId?: string | null,
): Promise<
  AuthContext & { organization?: ReturnType<typeof serializeWorkspace> }
> => {
  if (!organizationId) {
    return { userId, organizationId: null, membershipId: null, role: null };
  }

  const membership = await authRepository.findMembership(
    userId,
    organizationId,
  );

  if (!membership) {
    throw new ApiError(403, "You are not a member of this organization");
  }

  return {
    userId,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role.name,
    organization: serializeWorkspace(membership),
  };
};

const buildAccessToken = async (
  userId: string,
  organizationId?: string | null,
) => {
  const context = await resolveAccessContext(userId, organizationId);
  const { token } = generateAccessToken(userId, {
    organizationId: context.organizationId ?? undefined,
    membershipId: context.membershipId ?? undefined,
    role: context.role ?? undefined,
  });

  return { accessToken: token, context };
};

const createSession = async (
  userId: string,
  req: Request,
  activeOrganizationId?: string | null,
) => {
  const sessionId = randomUUID();
  const refreshToken = generateRefreshToken(userId, sessionId);
  const csrfToken = randomUUID();
  const refreshTokenHash = hashToken(refreshToken);
  const csrfTokenHash = hashToken(csrfToken);
  const { device, ipAddress } = getRequestMetadata(req);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);

  await authRepository.createRefreshSession({
    id: sessionId,
    userId,
    activeOrganizationId: activeOrganizationId ?? null,
    refreshToken: refreshTokenHash,
    device,
    ipAddress,
    expiresAt,
  });

  await storeRefreshSession(sessionId, {
    userId,
    refreshTokenHash,
    csrfTokenHash,
    activeOrganizationId: activeOrganizationId ?? null,
  });

  return { refreshToken, csrfToken, sessionId };
};

const verifyEmailToken = async (token: string) => {
  let payload: EmailTokenPayload;
  try {
    payload = verifyToken<EmailTokenPayload>(token, env.EMAIL_VERIFY_SECRET);
  } catch {
    throw new ApiError(400, "Invalid verification token");
  }

  if (payload.type !== "email_verify") {
    throw new ApiError(400, "Invalid verification token");
  }

  return payload;
};

const verifyPasswordResetToken = async (token: string) => {
  let payload: PasswordTokenPayload;
  try {
    payload = verifyToken<PasswordTokenPayload>(
      token,
      env.PASSWORD_RESET_SECRET,
    );
  } catch {
    throw new ApiError(400, "Invalid reset token");
  }

  if (payload.type !== "password_reset") {
    throw new ApiError(400, "Invalid reset token");
  }

  return payload;
};

const verifyRefreshSession = async (
  refreshToken: string,
  csrfToken: string | undefined,
) => {
  let payload: RefreshTokenPayload;
  try {
    payload = verifyToken<RefreshTokenPayload>(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token");
  }

  const cachedSession = await getRefreshSessionCache(payload.jti);
  if (!cachedSession) {
    throw new ApiError(401, "Session expired");
  }

  if (cachedSession.userId !== payload.sub) {
    throw new ApiError(401, "Session mismatch");
  }

  if (hashToken(refreshToken) !== cachedSession.refreshTokenHash) {
    throw new ApiError(401, "Refresh token reuse detected");
  }

  if (!csrfToken) {
    throw new ApiError(403, "CSRF token missing");
  }

  if (hashToken(csrfToken) !== cachedSession.csrfTokenHash) {
    throw new ApiError(403, "Invalid CSRF token");
  }

  const session = await authRepository.findRefreshSession(payload.jti);
  if (!session || session.revokedAt) {
    throw new ApiError(401, "Session revoked");
  }
  if (session.userId !== payload.sub) {
    throw new ApiError(401, "Session mismatch");
  }
  if (session.expiresAt < new Date()) {
    throw new ApiError(401, "Session expired");
  }

  return { payload, cachedSession, session };
};

export const authService = {
  register: async (payload: {
    name: string;
    email: string;
    password: string;
  }) => {
    const existing = await authRepository.findUserByEmail(payload.email);
    if (existing) {
      throw new ApiError(409, "Email already in use");
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await authRepository.createUser({
      name: payload.name,
      email: payload.email,
      password: passwordHash,
    });

    const tokenId = randomUUID();
    const emailToken = generateEmailVerificationToken(user.id, tokenId);
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN * 1000,
    );

    await authRepository.deleteEmailVerificationTokensForUser(user.id);
    await authRepository.createEmailVerificationToken({
      userId: user.id,
      token: tokenId,
      expiresAt,
    });

    await sendVerificationEmail(
      user.email,
      user.name,
      buildVerificationUrl(emailToken),
      Math.ceil(EMAIL_VERIFY_TOKEN_EXPIRES_IN / 60),
    );

    await auditService.recordAuthEvent({
      action: AUDIT_ACTIONS.AUTH_REGISTER,
      organizationId: null,
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return user;
  },

  signup: async (payload: {
    name: string;
    email: string;
    password: string;
  }) => authService.register(payload),

  login: async (payload: { email: string; password: string }, req: Request) => {
    const user = await authRepository.findUserByEmail(payload.email);
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isMatch = await comparePassword(payload.password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Email not verified");
    }

    const memberships = await authRepository.listUserMemberships(user.id);
    const activeWorkspace = memberships[0]
      ? serializeWorkspace(memberships[0])
      : null;
    const { accessToken } = await buildAccessToken(
      user.id,
      activeWorkspace?.id,
    );
    const { refreshToken, csrfToken } = await createSession(
      user.id,
      req,
      activeWorkspace?.id ?? null,
    );

    const requestMetadata = getRequestMetadata(req);
    await auditService.recordAuthEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN,
      organizationId: activeWorkspace?.id ?? null,
      userId: user.id,
      metadata: {
        device: requestMetadata.device,
        ipAddress: requestMetadata.ipAddress,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
      csrfToken,
      organizations: memberships.map(serializeWorkspace),
      activeOrganization: activeWorkspace,
    };
  },

  logout: async (
    userId: string,
    refreshToken?: string,
    auth?: Request["auth"],
    organizationId?: string | null,
  ) => {
    if (auth?.jti) {
      await blacklistAccessToken(auth.jti, auth.exp);
    }

    if (!refreshToken) {
      await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        organizationId,
        userId,
        metadata: {
          accessTokenId: auth?.jti ?? null,
          hadRefreshToken: false,
        },
      });
      return;
    }

    try {
      const payload = verifyToken<RefreshTokenPayload>(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      );

      if (payload.type !== "refresh") {
        return;
      }

      const session = await authRepository.findRefreshSession(payload.jti);
      if (!session || session.userId !== userId) {
        return;
      }

      await authRepository.revokeRefreshSession(payload.jti);
      await deleteRefreshSessionCache(payload.jti);
    } catch {
      await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        organizationId,
        userId,
        metadata: {
          accessTokenId: auth?.jti ?? null,
          hadRefreshToken: true,
          refreshTokenStatus: "invalid_or_unavailable",
        },
      });
      return;
    }

    await auditService.recordAuthEvent({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      organizationId,
      userId,
      metadata: {
        accessTokenId: auth?.jti ?? null,
        hadRefreshToken: true,
      },
    });
  },

  logoutAll: async (
    userId: string,
    auth?: Request["auth"],
    organizationId?: string | null,
  ) => {
    if (auth?.jti) {
      await blacklistAccessToken(auth.jti, auth.exp);
    }

    const sessions = await authRepository.listActiveRefreshSessions(userId);
    await authRepository.revokeAllRefreshSessions(userId);

    const keys = sessions.map((session) => refreshSessionKey(session.id));
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    await auditService.recordAuthEvent({
      action: AUDIT_ACTIONS.AUTH_LOGOUT_ALL,
      organizationId,
      userId,
      metadata: {
        accessTokenId: auth?.jti ?? null,
        revokedSessionCount: sessions.length,
      },
    });
  },

  refresh: async (
    refreshToken: string,
    csrfToken: string | undefined,
    req: Request,
  ) => {
    const { payload, session } = await verifyRefreshSession(
      refreshToken,
      csrfToken,
    );

    await authRepository.revokeRefreshSession(payload.jti);
    await deleteRefreshSessionCache(payload.jti);

    const { accessToken } = await buildAccessToken(
      payload.sub,
      session.activeOrganizationId,
    );
    const { refreshToken: newRefreshToken, csrfToken: newCsrfToken } =
      await createSession(payload.sub, req, session.activeOrganizationId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken: newCsrfToken,
    };
  },

  switchWorkspace: async (
    userId: string,
    organizationId: string,
    refreshToken: string,
    csrfToken: string | undefined,
  ) => {
    const { payload, cachedSession, session } = await verifyRefreshSession(
      refreshToken,
      csrfToken,
    );

    if (payload.sub !== userId || session.userId !== userId) {
      throw new ApiError(401, "Session mismatch");
    }

    const context = await resolveAccessContext(userId, organizationId);

    await authRepository.updateRefreshSessionOrganization(
      session.id,
      organizationId,
    );
    await storeRefreshSession(session.id, {
      ...cachedSession,
      activeOrganizationId: organizationId,
    });

    const { token: accessToken } = generateAccessToken(userId, {
      organizationId,
      membershipId: context.membershipId ?? undefined,
      role: context.role ?? undefined,
    });

    const memberships = await authRepository.listUserMemberships(userId);

    await auditService.recordAuthEvent({
      action: AUDIT_ACTIONS.AUTH_WORKSPACE_SWITCHED,
      organizationId,
      userId,
      metadata: {
        sessionId: session.id,
      },
    });

    return {
      accessToken,
      activeOrganization: context.organization ?? null,
      organizations: memberships.map(serializeWorkspace),
    };
  },

  verifyEmail: async (token: string) => {
    const payload = await verifyEmailToken(token);
    const stored = await authRepository.findEmailVerificationToken(payload.jti);

    if (!stored || stored.userId !== payload.sub) {
      throw new ApiError(400, "Invalid verification token");
    }

    if (stored.expiresAt < new Date()) {
      await authRepository.deleteEmailVerificationToken(stored.token);
      throw new ApiError(400, "Verification token expired");
    }

    await authRepository.markUserVerified(payload.sub);
    await authRepository.deleteEmailVerificationToken(stored.token);
  },

  resendVerification: async (email: string) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user || user.isVerified) {
      return;
    }

    const existingToken = await authRepository.findValidEmailVerificationTokenForUser(user.id);

    let tokenId: string;
    let emailToken: string;
    let expiresInMinutes: number;

    if (existingToken) {
      tokenId = existingToken.token;
      emailToken = generateEmailVerificationToken(user.id, tokenId);
      expiresInMinutes = Math.ceil((existingToken.expiresAt.getTime() - Date.now()) / 1000 / 60);
    } else {
      await authRepository.deleteEmailVerificationTokensForUser(user.id);

      tokenId = randomUUID();
      emailToken = generateEmailVerificationToken(user.id, tokenId);
      const expiresAt = new Date(
        Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN * 1000,
      );

      await authRepository.createEmailVerificationToken({
        userId: user.id,
        token: tokenId,
        expiresAt,
      });
      expiresInMinutes = Math.ceil(EMAIL_VERIFY_TOKEN_EXPIRES_IN / 60);
    }

    await sendVerificationEmail(
      user.email,
      user.name,
      buildVerificationUrl(emailToken),
      expiresInMinutes,
    );
  },

  forgotPassword: async (email: string) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return;
    }

    const tokenId = randomUUID();
    const resetToken = generatePasswordResetToken(user.id, tokenId);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_IN * 1000,
    );

    await authRepository.deletePasswordResetTokensForUser(user.id);
    await authRepository.createPasswordResetToken({
      userId: user.id,
      token: tokenId,
      expiresAt,
    });

    await sendPasswordResetEmail(
      user.email,
      user.name,
      buildPasswordResetUrl(resetToken),
      Math.ceil(PASSWORD_RESET_TOKEN_EXPIRES_IN / 60),
    );
  },

  resetPassword: async (token: string, password: string) => {
    const payload = await verifyPasswordResetToken(token);
    const stored = await authRepository.findPasswordResetToken(payload.jti);

    if (!stored || stored.userId !== payload.sub) {
      throw new ApiError(400, "Invalid reset token");
    }

    if (stored.expiresAt < new Date()) {
      await authRepository.deletePasswordResetToken(stored.token);
      throw new ApiError(400, "Reset token expired");
    }

    const passwordHash = await hashPassword(password);
    await authRepository.updateUserPassword(payload.sub, passwordHash);
    await authRepository.deletePasswordResetToken(stored.token);

    const sessions = await authRepository.listActiveRefreshSessions(
      payload.sub,
    );
    await authRepository.revokeAllRefreshSessions(payload.sub);

    const keys = sessions.map((session) => refreshSessionKey(session.id));
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  },

  getMe: async (userId: string, activeOrganizationId?: string | null) => {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const memberships = await authRepository.listUserMemberships(userId);
    const organizations = memberships.map(serializeWorkspace);
    const activeOrganization = activeOrganizationId
      ? (organizations.find(
          (organization) => organization.id === activeOrganizationId,
        ) ?? null)
      : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      organizations,
      activeOrganization,
    };
  },
};
