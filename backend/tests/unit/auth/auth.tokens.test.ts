import { jest } from "@jest/globals";

// ── Hoist mock fns before any imports ────────────────────────────────────────
const mockSignToken = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock("../../../src/lib/jwt.js", () => ({
  signToken: mockSignToken,
  verifyToken: mockVerifyToken,
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

jest.mock("../../../src/modules/auth/auth.constants.js", () => ({
  ACCESS_TOKEN_EXPIRES_IN: 900,
  REFRESH_TOKEN_EXPIRES_IN: 604800,
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: 86400,
  PASSWORD_RESET_TOKEN_EXPIRES_IN: 3600,
  REFRESH_COOKIE_NAME: "refreshToken",
  CSRF_COOKIE_NAME: "csrfToken",
}));

import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../../src/modules/auth/auth.tokens.js";
import ApiError from "../../../src/utils/ApiError.js";

describe("auth.tokens", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── generateAccessToken ───────────────────────────────────────────────────
  describe("generateAccessToken()", () => {
    it("should call signToken with access type, userId as sub, and correct secret", () => {
      mockSignToken.mockReturnValue("access.token");

      const result = generateAccessToken("user-1", {
        organizationId: "org-1",
        membershipId: "mem-1",
        role: "admin",
      });

      expect(mockSignToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "user-1",
          type: "access",
          organizationId: "org-1",
          membershipId: "mem-1",
          role: "admin",
        }),
        "access-secret",
        { expiresIn: 900 },
      );
      expect(result.token).toBe("access.token");
      expect(result.jti).toBeDefined();
    });

    it("should generate a unique JTI (UUID) each call", () => {
      mockSignToken.mockReturnValue("token");

      const { jti: jti1 } = generateAccessToken("user-1");
      const { jti: jti2 } = generateAccessToken("user-1");

      expect(jti1).not.toBe(jti2);
    });

    it("should set context fields to undefined when no context provided", () => {
      mockSignToken.mockReturnValue("token");

      generateAccessToken("user-1");

      expect(mockSignToken).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: undefined,
          membershipId: undefined,
          role: undefined,
        }),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  // ── generateRefreshToken ──────────────────────────────────────────────────
  describe("generateRefreshToken()", () => {
    it("should call signToken with refresh type and correct secret", () => {
      mockSignToken.mockReturnValue("refresh.token");

      const result = generateRefreshToken("user-1", "session-id-123");

      expect(mockSignToken).toHaveBeenCalledWith(
        { sub: "user-1", jti: "session-id-123", type: "refresh" },
        "refresh-secret",
        { expiresIn: 604800 },
      );
      expect(result).toBe("refresh.token");
    });
  });

  // ── generateEmailVerificationToken ────────────────────────────────────────
  describe("generateEmailVerificationToken()", () => {
    it("should call signToken with email_verify type", () => {
      mockSignToken.mockReturnValue("email.token");

      const result = generateEmailVerificationToken("user-1", "token-id-abc");

      expect(mockSignToken).toHaveBeenCalledWith(
        { sub: "user-1", jti: "token-id-abc", type: "email_verify" },
        "email-secret",
        { expiresIn: 86400 },
      );
      expect(result).toBe("email.token");
    });
  });

  // ── generatePasswordResetToken ────────────────────────────────────────────
  describe("generatePasswordResetToken()", () => {
    it("should call signToken with password_reset type", () => {
      mockSignToken.mockReturnValue("reset.token");

      const result = generatePasswordResetToken("user-1", "token-id-xyz");

      expect(mockSignToken).toHaveBeenCalledWith(
        { sub: "user-1", jti: "token-id-xyz", type: "password_reset" },
        "reset-secret",
        { expiresIn: 3600 },
      );
      expect(result).toBe("reset.token");
    });
  });

  // ── verifyAccessToken ─────────────────────────────────────────────────────
  describe("verifyAccessToken()", () => {
    it("should return the payload when the token is valid and type is 'access'", () => {
      const payload = { sub: "user-1", jti: "jti-1", type: "access", exp: 9999999 };
      mockVerifyToken.mockReturnValue(payload);

      const result = verifyAccessToken("valid.access.token");

      expect(result).toEqual(payload);
      expect(mockVerifyToken).toHaveBeenCalledWith("valid.access.token", "access-secret");
    });

    it("should throw ApiError 401 when token type is not 'access'", () => {
      mockVerifyToken.mockReturnValue({ sub: "user-1", jti: "j", type: "refresh" });

      expect(() => verifyAccessToken("refresh.token")).toThrow(ApiError);
      expect(() => verifyAccessToken("refresh.token")).toThrow("Invalid access token");
    });

    it("should throw ApiError 401 when verifyToken throws (expired/malformed)", () => {
      mockVerifyToken.mockImplementation(() => { throw new Error("jwt expired"); });

      expect(() => verifyAccessToken("expired.token")).toThrow(ApiError);
    });

    it("should rethrow an ApiError directly without wrapping", () => {
      const original = new ApiError(401, "Invalid access token");
      mockVerifyToken.mockReturnValue({ type: "wrong" });

      // Second call: trigger wrong type path which throws ApiError
      expect(() => verifyAccessToken("bad.token")).toThrow(ApiError);
    });
  });

  // ── verifyRefreshToken ────────────────────────────────────────────────────
  describe("verifyRefreshToken()", () => {
    it("should return the payload when the token is valid and type is 'refresh'", () => {
      const payload = { sub: "user-1", jti: "session-1", type: "refresh" };
      mockVerifyToken.mockReturnValue(payload);

      const result = verifyRefreshToken("valid.refresh.token");

      expect(result).toEqual(payload);
      expect(mockVerifyToken).toHaveBeenCalledWith("valid.refresh.token", "refresh-secret");
    });

    it("should throw ApiError 401 when token type is not 'refresh'", () => {
      mockVerifyToken.mockReturnValue({ sub: "user-1", jti: "j", type: "access" });

      expect(() => verifyRefreshToken("access.token")).toThrow("Invalid refresh token");
    });

    it("should throw ApiError 401 when verifyToken throws (expired/malformed)", () => {
      mockVerifyToken.mockImplementation(() => { throw new Error("jwt expired"); });

      expect(() => verifyRefreshToken("expired.token")).toThrow(ApiError);
    });

    it("should rethrow ApiError when it is thrown internally with wrong type", () => {
      mockVerifyToken.mockReturnValue({ type: "wrong" });

      try {
        verifyRefreshToken("bad.token");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(401);
      }
    });
  });
});
