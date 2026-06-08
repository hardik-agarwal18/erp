import { jest } from "@jest/globals";

// ── All mocks must be hoisted ─────────────────────────────────────────────────
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();

jest.mock("../../../src/config/redis.js", () => ({
  redisClient: { get: mockRedisGet, set: mockRedisSet, del: mockRedisDel },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: {
    JWT_ACCESS_SECRET: "access-secret",
    JWT_REFRESH_SECRET: "refresh-secret",
    EMAIL_VERIFY_SECRET: "email-secret",
    PASSWORD_RESET_SECRET: "reset-secret",
    NODE_ENV: "test",
  },
}));

jest.mock("../../../src/lib/jwt.js", () => ({
  verifyToken: jest.fn(),
  signToken: jest.fn(),
}));

jest.mock("../../../src/lib/bcrypt.js", () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock("../../../src/modules/auth/auth.repository.js", () => ({
  authRepository: {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    listUserMemberships: jest.fn(),
    findMembership: jest.fn(),
    createRefreshSession: jest.fn(),
    findRefreshSession: jest.fn(),
    revokeRefreshSession: jest.fn(),
    revokeAllRefreshSessions: jest.fn(),
    listActiveRefreshSessions: jest.fn(),
    updateRefreshSessionOrganization: jest.fn(),
    updateUserPassword: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    findEmailVerificationToken: jest.fn(),
    deleteEmailVerificationToken: jest.fn(),
    deleteEmailVerificationTokensForUser: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    deletePasswordResetToken: jest.fn(),
    deletePasswordResetTokensForUser: jest.fn(),
    findValidEmailVerificationTokenForUser: jest.fn(),
    markUserVerified: jest.fn(),
  },
}));

jest.mock("../../../src/modules/auth/auth.tokens.js", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generateEmailVerificationToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
}));

jest.mock("../../../src/modules/auth/auth.utils.js", () => ({
  hashToken: jest.fn(),
  getRequestMetadata: jest.fn(),
  buildVerificationUrl: jest.fn(),
  buildPasswordResetUrl: jest.fn(),
  buildInvitationUrl: jest.fn(),
}));

jest.mock("../../../src/mail/mail.service.js", () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    AUTH_REGISTER: "auth.register",
    AUTH_LOGIN: "auth.login",
    AUTH_LOGOUT: "auth.logout",
    AUTH_LOGOUT_ALL: "auth.logout.all",
    AUTH_WORKSPACE_SWITCHED: "auth.workspace.switched",
  },
  auditService: {
    recordAuthEvent: jest.fn(),
    recordIfContext: jest.fn(),
    record: jest.fn(),
  },
}));

jest.mock("../../../src/modules/auth/auth.constants.js", () => ({
  ACCESS_TOKEN_EXPIRES_IN: 900,
  REFRESH_TOKEN_EXPIRES_IN: 604800,
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: 86400,
  PASSWORD_RESET_TOKEN_EXPIRES_IN: 3600,
  REFRESH_COOKIE_NAME: "refreshToken",
  CSRF_COOKIE_NAME: "csrfToken",
}));

import { verifyToken } from "../../../src/lib/jwt.js";
import { comparePassword, hashPassword } from "../../../src/lib/bcrypt.js";
import { authRepository } from "../../../src/modules/auth/auth.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from "../../../src/modules/auth/auth.tokens.js";
import {
  hashToken,
  getRequestMetadata,
  buildVerificationUrl,
  buildPasswordResetUrl,
} from "../../../src/modules/auth/auth.utils.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../../src/mail/mail.service.js";
import { auditService } from "../../../src/services/audit/index.js";
import { authService } from "../../../src/modules/auth/auth.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import { Request } from "express";

// ── Helper factories ──────────────────────────────────────────────────────────
const makeReq = (overrides: any = {}): Request =>
  ({
    get: (h: string) => (h === "user-agent" ? "TestAgent/1.0" : undefined),
    ip: "127.0.0.1",
    headers: {},
    ...overrides,
  } as unknown as Request);

const baseUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@test.com",
  password: "hashed-pw",
  isVerified: true,
};

const baseMembership = {
  id: "mem-1",
  organizationId: "org-1",
  roleId: "role-1",
  role: { name: "admin" },
  organization: {
    id: "org-1",
    name: "Acme",
    slug: "acme",
    logo: null,
    ownerId: "user-1",
    createdAt: new Date(),
  },
};

const baseRefreshPayload = {
  sub: "user-1",
  jti: "session-1",
  type: "refresh",
};

const baseSession = {
  id: "session-1",
  userId: "user-1",
  revokedAt: null,
  expiresAt: new Date(Date.now() + 9999999999),
  activeOrganizationId: "org-1",
};

const baseCachedSession = {
  userId: "user-1",
  refreshTokenHash: "correct-hash",
  csrfTokenHash: "csrf-hash",
  activeOrganizationId: "org-1",
};

// ── Helper: set up a passing verifyRefreshSession scenario ──────────────────
function setupValidRefreshSession() {
  (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
  mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
  (hashToken as jest.Mock).mockImplementation((t: string) =>
    t === "correct-csrf" ? "csrf-hash" : "correct-hash",
  );
  (authRepository.findRefreshSession as jest.Mock).mockResolvedValue(baseSession);
}

// ════════════════════════════════════════════════════════════════════════════
//  verifyRefreshSession (internal) — tested via authService.refresh
// ════════════════════════════════════════════════════════════════════════════
describe("authService — verifyRefreshSession branches (via refresh)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRequestMetadata as jest.Mock).mockReturnValue({ device: "TestAgent/1.0", ipAddress: "127.0.0.1" });
    (generateAccessToken as jest.Mock).mockReturnValue({ token: "new-access-token", jti: "new-jti" });
    (generateRefreshToken as jest.Mock).mockReturnValue("new-refresh-token");
    mockRedisSet.mockResolvedValue("OK");
    mockRedisDel.mockResolvedValue(1);
    (authRepository.revokeRefreshSession as jest.Mock).mockResolvedValue({});
    (authRepository.createRefreshSession as jest.Mock).mockResolvedValue({});
    (authRepository.findMembership as jest.Mock).mockResolvedValue(baseMembership);
    (hashToken as jest.Mock).mockReturnValue("correct-hash");
  });

  it("should throw ApiError 401 when refresh token is invalid (JWT exception)", async () => {
    (verifyToken as jest.Mock).mockImplementation(() => { throw new Error("jwt invalid"); });

    await expect(authService.refresh("bad-token", "csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid refresh token",
    });
  });

  it("should throw ApiError 401 when payload type is not 'refresh'", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "s-1", type: "access" });

    await expect(authService.refresh("access-token", "csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid refresh token",
    });
  });

  it("should throw ApiError 401 'Session expired' when Redis has no cached session", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(null); // not in cache

    await expect(authService.refresh("token", "csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Session expired",
    });
  });

  it("should throw ApiError 401 'Session mismatch' when cached userId differs from payload.sub", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify({ ...baseCachedSession, userId: "other-user" }));

    await expect(authService.refresh("token", "csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Session mismatch",
    });
  });

  it("should throw ApiError 401 'Refresh token reuse detected' when hash does not match", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify({ ...baseCachedSession, refreshTokenHash: "different-hash" }));
    (hashToken as jest.Mock).mockReturnValue("correct-hash"); // hash of provided token

    await expect(authService.refresh("token", "csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Refresh token reuse detected",
    });
  });

  it("should throw ApiError 403 'CSRF token missing' when csrfToken is undefined", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
    (hashToken as jest.Mock).mockReturnValue("correct-hash");

    await expect(authService.refresh("token", undefined, makeReq())).rejects.toMatchObject({
      statusCode: 403,
      message: "CSRF token missing",
    });
  });

  it("should throw ApiError 403 'Invalid CSRF token' when CSRF hash doesn't match", async () => {
    // refreshTokenHash check passes (hash(token) === stored.refreshTokenHash)
    // but csrfTokenHash check fails (hash(csrfToken) !== stored.csrfTokenHash)
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    // stored has refreshTokenHash: "rt-hash" and csrfTokenHash: "correct-csrf-hash"
    mockRedisGet.mockResolvedValue(JSON.stringify({
      ...baseCachedSession,
      refreshTokenHash: "rt-hash",
      csrfTokenHash: "correct-csrf-hash",
    }));
    // hashToken called with refresh token → "rt-hash" (matches)
    // hashToken called with csrf token → "wrong-csrf-hash" (doesn't match)
    (hashToken as jest.Mock)
      .mockReturnValueOnce("rt-hash")       // first call: hash(refreshToken)
      .mockReturnValueOnce("wrong-csrf-hash"); // second call: hash(csrfToken)

    await expect(authService.refresh("token", "wrong-csrf", makeReq())).rejects.toMatchObject({
      statusCode: 403,
      message: "Invalid CSRF token",
    });
  });

  it("should throw ApiError 401 'Session revoked' when DB session has revokedAt set", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
    (hashToken as jest.Mock).mockImplementation((t: string) =>
      t === "correct-csrf" ? "csrf-hash" : "correct-hash",
    );
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue({
      ...baseSession,
      revokedAt: new Date(Date.now() - 1000),
    });

    await expect(authService.refresh("token", "correct-csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Session revoked",
    });
  });

  it("should throw ApiError 401 'Session revoked' when DB session is not found", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
    (hashToken as jest.Mock).mockImplementation((t: string) =>
      t === "correct-csrf" ? "csrf-hash" : "correct-hash",
    );
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue(null);

    await expect(authService.refresh("token", "correct-csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Session revoked",
    });
  });

  it("should throw ApiError 401 'Session expired' when DB session expiresAt is in the past", async () => {
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
    (hashToken as jest.Mock).mockImplementation((t: string) =>
      t === "correct-csrf" ? "csrf-hash" : "correct-hash",
    );
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue({
      ...baseSession,
      expiresAt: new Date(Date.now() - 1000), // expired
    });

    await expect(authService.refresh("token", "correct-csrf", makeReq())).rejects.toMatchObject({
      statusCode: 401,
      message: "Session expired",
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.logout
// ════════════════════════════════════════════════════════════════════════════
describe("authService.logout()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auditService.recordAuthEvent as jest.Mock).mockResolvedValue(null);
    mockRedisSet.mockResolvedValue("OK");
    mockRedisDel.mockResolvedValue(1);
  });

  it("should early-return and record audit when refreshToken is undefined", async () => {
    await authService.logout("user-1", undefined, { jti: "jti-1", exp: 9999999, token: "t" });

    expect(authRepository.revokeRefreshSession).not.toHaveBeenCalled();
    expect(auditService.recordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ hadRefreshToken: false }) }),
    );
  });

  it("should blacklist the access token when auth.jti is present", async () => {
    await authService.logout("user-1", undefined, { jti: "jti-1", exp: 9999999999, token: "t" });

    expect(mockRedisSet).toHaveBeenCalledWith(
      "blacklist:jti-1",
      "1",
      expect.objectContaining({ EX: expect.any(Number) }),
    );
  });

  it("should record audit with hadRefreshToken: true and invalid status on JWT error", async () => {
    (verifyToken as jest.Mock).mockImplementation(() => { throw new Error("invalid"); });

    await authService.logout("user-1", "invalid-refresh-token");

    expect(auditService.recordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          hadRefreshToken: true,
          refreshTokenStatus: "invalid_or_unavailable",
        }),
      }),
    );
  });

  it("should revoke session and record successful audit when refresh token is valid", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ ...baseRefreshPayload, type: "refresh" });
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue(baseSession);
    (authRepository.revokeRefreshSession as jest.Mock).mockResolvedValue({});

    await authService.logout("user-1", "valid-refresh-token");

    expect(authRepository.revokeRefreshSession).toHaveBeenCalledWith("session-1");
    expect(auditService.recordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ hadRefreshToken: true }),
      }),
    );
  });

  it("should not revoke when session userId does not match caller userId", async () => {
    // payload.sub = "user-1" (matches caller), but session.userId = "different-user"
    (verifyToken as jest.Mock).mockReturnValue({ ...baseRefreshPayload, type: "refresh", sub: "user-1" });
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue({
      ...baseSession,
      userId: "different-user", // mismatch
    });

    await authService.logout("user-1", "valid-token");

    expect(authRepository.revokeRefreshSession).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.logoutAll
// ════════════════════════════════════════════════════════════════════════════
describe("authService.logoutAll()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue("OK");
    mockRedisDel.mockResolvedValue(1);
    (authRepository.revokeAllRefreshSessions as jest.Mock).mockResolvedValue({});
    (auditService.recordAuthEvent as jest.Mock).mockResolvedValue(null);
  });

  it("should NOT call redisClient.del when there are no active sessions", async () => {
    (authRepository.listActiveRefreshSessions as jest.Mock).mockResolvedValue([]);

    await authService.logoutAll("user-1");

    expect(mockRedisDel).not.toHaveBeenCalled();
    expect(auditService.recordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ revokedSessionCount: 0 }) }),
    );
  });

  it("should call redisClient.del with all session keys when sessions exist", async () => {
    (authRepository.listActiveRefreshSessions as jest.Mock).mockResolvedValue([
      { id: "session-A" },
      { id: "session-B" },
    ]);

    await authService.logoutAll("user-1");

    expect(mockRedisDel).toHaveBeenCalledWith([
      "refresh:session-A",
      "refresh:session-B",
    ]);
    expect(auditService.recordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ revokedSessionCount: 2 }) }),
    );
  });

  it("should blacklist access token when auth.jti is provided", async () => {
    (authRepository.listActiveRefreshSessions as jest.Mock).mockResolvedValue([]);
    const auth = { jti: "access-jti", exp: 9999999999, token: "t" };

    await authService.logoutAll("user-1", auth);

    expect(mockRedisSet).toHaveBeenCalledWith(
      "blacklist:access-jti",
      "1",
      expect.objectContaining({ EX: expect.any(Number) }),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.switchWorkspace
// ════════════════════════════════════════════════════════════════════════════
describe("authService.switchWorkspace()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRequestMetadata as jest.Mock).mockReturnValue({ device: "TestAgent", ipAddress: "127.0.0.1" });
    mockRedisGet.mockResolvedValue(JSON.stringify(baseCachedSession));
    mockRedisSet.mockResolvedValue("OK");
    mockRedisDel.mockResolvedValue(1);
    (verifyToken as jest.Mock).mockReturnValue(baseRefreshPayload);
    (hashToken as jest.Mock).mockImplementation((t: string) =>
      t === "correct-csrf" ? "csrf-hash" : "correct-hash",
    );
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue(baseSession);
    (authRepository.findMembership as jest.Mock).mockResolvedValue(baseMembership);
    (authRepository.updateRefreshSessionOrganization as jest.Mock).mockResolvedValue({});
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([baseMembership]);
    (generateAccessToken as jest.Mock).mockReturnValue({ token: "new-access", jti: "new-jti" });
    (auditService.recordAuthEvent as jest.Mock).mockResolvedValue(null);
  });

  it("should return new accessToken and organizations on success", async () => {
    const result = await authService.switchWorkspace(
      "user-1",
      "org-1",
      "valid-refresh",
      "correct-csrf",
    );

    expect(result.accessToken).toBe("new-access");
    expect(result.organizations).toHaveLength(1);
    expect(auditService.recordAuthEvent).toHaveBeenCalled();
  });

  it("should throw ApiError 401 'Session mismatch' when userId does not match payload.sub", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ ...baseRefreshPayload, sub: "other-user" });
    mockRedisGet.mockResolvedValue(JSON.stringify({ ...baseCachedSession, userId: "other-user" }));
    (authRepository.findRefreshSession as jest.Mock).mockResolvedValue({ ...baseSession, userId: "other-user" });

    await expect(
      authService.switchWorkspace("user-1", "org-1", "token", "correct-csrf"),
    ).rejects.toMatchObject({ statusCode: 401, message: "Session mismatch" });
  });

  it("should throw ApiError 403 when user is not a member of target organization", async () => {
    (authRepository.findMembership as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.switchWorkspace("user-1", "org-other", "valid-refresh", "correct-csrf"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should throw ApiError 403 CSRF token missing when csrfToken is undefined", async () => {
    await expect(
      authService.switchWorkspace("user-1", "org-1", "valid-refresh", undefined),
    ).rejects.toMatchObject({ statusCode: 403, message: "CSRF token missing" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.verifyEmail
// ════════════════════════════════════════════════════════════════════════════
describe("authService.verifyEmail()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw ApiError 400 when the JWT is invalid", async () => {
    (verifyToken as jest.Mock).mockImplementation(() => { throw new Error("invalid"); });

    await expect(authService.verifyEmail("bad-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid verification token",
    });
  });

  it("should throw ApiError 400 when token type is not 'email_verify'", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });

    await expect(authService.verifyEmail("wrong-type-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid verification token",
    });
  });

  it("should throw ApiError 400 when token record not found in DB", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "email_verify" });
    (authRepository.findEmailVerificationToken as jest.Mock).mockResolvedValue(null);

    await expect(authService.verifyEmail("valid-but-missing-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid verification token",
    });
  });

  it("should throw ApiError 400 when stored userId does not match payload.sub", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "email_verify" });
    (authRepository.findEmailVerificationToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "other-user",
      expiresAt: new Date(Date.now() + 10000),
    });

    await expect(authService.verifyEmail("token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid verification token",
    });
  });

  it("should throw ApiError 400 'Verification token expired' when expiresAt is in the past", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "email_verify" });
    (authRepository.findEmailVerificationToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1000), // expired
    });
    (authRepository.deleteEmailVerificationToken as jest.Mock).mockResolvedValue({});

    await expect(authService.verifyEmail("expired-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Verification token expired",
    });

    expect(authRepository.deleteEmailVerificationToken).toHaveBeenCalledWith("t1");
  });

  it("should mark user verified and delete token on success", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "email_verify" });
    (authRepository.findEmailVerificationToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 100000),
    });
    (authRepository.markUserVerified as jest.Mock).mockResolvedValue({});
    (authRepository.deleteEmailVerificationToken as jest.Mock).mockResolvedValue({});

    await authService.verifyEmail("valid-token");

    expect(authRepository.markUserVerified).toHaveBeenCalledWith("user-1");
    expect(authRepository.deleteEmailVerificationToken).toHaveBeenCalledWith("t1");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.resendVerification
// ════════════════════════════════════════════════════════════════════════════
describe("authService.resendVerification()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateEmailVerificationToken as jest.Mock).mockReturnValue("email-verify-token");
    (buildVerificationUrl as jest.Mock).mockReturnValue("http://localhost/verify?token=abc");
    (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
    (authRepository.deleteEmailVerificationTokensForUser as jest.Mock).mockResolvedValue({});
    (authRepository.createEmailVerificationToken as jest.Mock).mockResolvedValue({});
  });

  it("should silently return when user does not exist", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

    await authService.resendVerification("ghost@test.com");

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should silently return when user is already verified", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ ...baseUser, isVerified: true });

    await authService.resendVerification("alice@test.com");

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should send verification email when user exists and is not verified", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ ...baseUser, isVerified: false });

    await authService.resendVerification("alice@test.com");

    expect(sendVerificationEmail).toHaveBeenCalled();
    expect(authRepository.createEmailVerificationToken).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.forgotPassword
// ════════════════════════════════════════════════════════════════════════════
describe("authService.forgotPassword()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generatePasswordResetToken as jest.Mock).mockReturnValue("reset-token");
    (buildPasswordResetUrl as jest.Mock).mockReturnValue("http://localhost/reset?token=abc");
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
    (authRepository.deletePasswordResetTokensForUser as jest.Mock).mockResolvedValue({});
    (authRepository.createPasswordResetToken as jest.Mock).mockResolvedValue({});
  });

  it("should silently return when user does not exist (no email enumeration)", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

    await authService.forgotPassword("unknown@test.com");

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should send password reset email when user exists", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(baseUser);

    await authService.forgotPassword("alice@test.com");

    expect(sendPasswordResetEmail).toHaveBeenCalled();
    expect(authRepository.createPasswordResetToken).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.resetPassword
// ════════════════════════════════════════════════════════════════════════════
describe("authService.resetPassword()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisDel.mockResolvedValue(1);
    (hashPassword as jest.Mock).mockResolvedValue("new-hashed-pw");
    (authRepository.updateUserPassword as jest.Mock).mockResolvedValue({});
    (authRepository.deletePasswordResetToken as jest.Mock).mockResolvedValue({});
    (authRepository.revokeAllRefreshSessions as jest.Mock).mockResolvedValue({});
  });

  it("should throw ApiError 400 when reset JWT is invalid", async () => {
    (verifyToken as jest.Mock).mockImplementation(() => { throw new Error("invalid"); });

    await expect(authService.resetPassword("bad-token", "NewPass1!")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid reset token",
    });
  });

  it("should throw ApiError 400 when token type is not 'password_reset'", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "email_verify" });

    await expect(authService.resetPassword("wrong-type", "NewPass1!")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid reset token",
    });
  });

  it("should throw ApiError 400 when token record not found in DB", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });
    (authRepository.findPasswordResetToken as jest.Mock).mockResolvedValue(null);

    await expect(authService.resetPassword("token", "NewPass1!")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid reset token",
    });
  });

  it("should throw ApiError 400 when stored userId doesn't match payload.sub", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });
    (authRepository.findPasswordResetToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "other-user",
      expiresAt: new Date(Date.now() + 99999),
    });

    await expect(authService.resetPassword("token", "NewPass1!")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid reset token",
    });
  });

  it("should throw ApiError 400 'Reset token expired' and delete it when past expiresAt", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });
    (authRepository.findPasswordResetToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(authService.resetPassword("expired-token", "pass")).rejects.toMatchObject({
      statusCode: 400,
      message: "Reset token expired",
    });

    expect(authRepository.deletePasswordResetToken).toHaveBeenCalledWith("t1");
  });

  it("should update password, delete token, and revoke all sessions on success", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });
    (authRepository.findPasswordResetToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 99999),
    });
    (authRepository.listActiveRefreshSessions as jest.Mock).mockResolvedValue([
      { id: "s-1" },
      { id: "s-2" },
    ]);

    await authService.resetPassword("valid-token", "NewPass1!");

    expect(hashPassword).toHaveBeenCalledWith("NewPass1!");
    expect(authRepository.updateUserPassword).toHaveBeenCalledWith("user-1", "new-hashed-pw");
    expect(authRepository.deletePasswordResetToken).toHaveBeenCalledWith("t1");
    expect(authRepository.revokeAllRefreshSessions).toHaveBeenCalledWith("user-1");
    expect(mockRedisDel).toHaveBeenCalledWith(["refresh:s-1", "refresh:s-2"]);
  });

  it("should NOT call redisClient.del when there are no active sessions to revoke", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1", jti: "t1", type: "password_reset" });
    (authRepository.findPasswordResetToken as jest.Mock).mockResolvedValue({
      token: "t1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 99999),
    });
    (authRepository.listActiveRefreshSessions as jest.Mock).mockResolvedValue([]);

    await authService.resetPassword("token", "Pass1!");

    expect(mockRedisDel).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  authService.getMe
// ════════════════════════════════════════════════════════════════════════════
describe("authService.getMe()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw ApiError 404 when user is not found", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(null);

    await expect(authService.getMe("ghost-user")).rejects.toMatchObject({
      statusCode: 404,
      message: "User not found",
    });
  });

  it("should return user with no organizations and null activeOrganization when no memberships", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(baseUser);
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([]);

    const result = await authService.getMe("user-1");

    expect(result.organizations).toEqual([]);
    expect(result.activeOrganization).toBeNull();
  });

  it("should return null activeOrganization when activeOrganizationId is not provided", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(baseUser);
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([baseMembership]);

    const result = await authService.getMe("user-1", null);

    expect(result.activeOrganization).toBeNull();
  });

  it("should resolve the correct activeOrganization when activeOrganizationId matches", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(baseUser);
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([baseMembership]);

    const result = await authService.getMe("user-1", "org-1");

    expect(result.activeOrganization).not.toBeNull();
    expect(result.activeOrganization?.id).toBe("org-1");
  });

  it("should return null activeOrganization when activeOrganizationId doesn't match any membership", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(baseUser);
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([baseMembership]);

    const result = await authService.getMe("user-1", "org-not-joined");

    expect(result.activeOrganization).toBeNull();
  });

  it("should return correct user fields", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(baseUser);
    (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([]);

    const result = await authService.getMe("user-1");

    expect(result).toMatchObject({
      id: "user-1",
      name: "Alice",
      email: "alice@test.com",
      isVerified: true,
    });
  });
});
