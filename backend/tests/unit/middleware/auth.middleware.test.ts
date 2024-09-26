import { jest } from "@jest/globals";

// ── Mock all dependencies ───────────────────────────────────────────────────
jest.mock("../../../src/lib/jwt.js", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("../../../src/config/redis.js", () => ({
  redisClient: {
    get: jest.fn(),
  },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: {
    JWT_ACCESS_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../src/middleware/auth.middleware.js";
import { verifyToken } from "../../../src/lib/jwt.js";
import { redisClient } from "../../../src/config/redis.js";
import ApiError from "../../../src/utils/ApiError.js";

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers } as Partial<Request>;
}

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

// ── Test Suite ───────────────────────────────────────────────────────────────
describe("authMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Missing / Malformed header ──────────────────────────────────────────
  describe("Authorization header validation", () => {
    it("should call next(ApiError 401) when Authorization header is missing", async () => {
      const req = makeReq();
      const next = makeNext();

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when Authorization header does not start with Bearer", async () => {
      const req = makeReq({ authorization: "Basic dXNlcjpwYXNz" });
      const next = makeNext();

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when Bearer prefix present but no token follows", async () => {
      const req = makeReq({ authorization: "Bearer " });
      const next = makeNext();

      // verifyToken will throw when given an empty string
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when header value is just 'Bearer' with no space", async () => {
      const req = makeReq({ authorization: "Bearertoken" });
      const next = makeNext();

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });
  });

  // ── JWT verification failures ───────────────────────────────────────────
  describe("JWT verification", () => {
    it("should call next(ApiError 401) when token is expired", async () => {
      const req = makeReq({ authorization: "Bearer expired.token.here" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockImplementation(() => {
        const err = new Error("jwt expired");
        err.name = "TokenExpiredError";
        throw err;
      });

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when token signature is invalid", async () => {
      const req = makeReq({ authorization: "Bearer tampered.token.value" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockImplementation(() => {
        const err = new Error("invalid signature");
        err.name = "JsonWebTokenError";
        throw err;
      });

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when token is malformed/corrupted", async () => {
      const req = makeReq({ authorization: "Bearer not-a-jwt" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });

    it("should call next(ApiError 401) when verifyToken throws an unexpected error", async () => {
      const req = makeReq({ authorization: "Bearer valid.looking.token" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new TypeError("Unexpected internal error");
      });

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });
  });

  // ── Payload validation ──────────────────────────────────────────────────
  describe("Token payload validation", () => {
    it("should call next(ApiError 401) when token type is not 'access'", async () => {
      const req = makeReq({ authorization: "Bearer valid.refresh.token" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-1",
        jti: "jti-1",
        type: "refresh", // Wrong type
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authMiddleware(req as Request, makeRes() as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });
  });

  // ── Token revocation (blacklist) ────────────────────────────────────────
  describe("Token blacklist", () => {
    it("should call next(ApiError 401) when token JTI is blacklisted in Redis", async () => {
      const req = makeReq({ authorization: "Bearer valid.blacklisted.token" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-1",
        jti: "jti-blacklisted",
        type: "access",
        exp: Math.floor(Date.now() / 1000) + 3600,
        organizationId: "org-1",
        membershipId: "mem-1",
        role: "admin",
      });
      (redisClient.get as jest.Mock).mockResolvedValue("revoked"); // blacklisted

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(redisClient.get).toHaveBeenCalledWith("blacklist:jti-blacklisted");
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Token revoked");
    });
  });

  // ── Happy path ──────────────────────────────────────────────────────────
  describe("Happy path", () => {
    it("should set req.user and req.auth then call next() with no error for a valid token", async () => {
      const req = makeReq({ authorization: "Bearer valid.access.token" }) as Request & {
        user?: any;
        auth?: any;
      };
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-1",
        jti: "jti-valid",
        type: "access",
        exp: Math.floor(Date.now() / 1000) + 3600,
        organizationId: "org-1",
        membershipId: "mem-1",
        role: "admin",
      });
      (redisClient.get as jest.Mock).mockResolvedValue(null); // not blacklisted

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(next).toHaveBeenCalledWith(); // called with no args == success
      expect(req.user).toEqual({
        id: "user-1",
        organizationId: "org-1",
        membershipId: "mem-1",
        role: "admin",
      });
      expect(req.auth).toEqual({
        jti: "jti-valid",
        exp: expect.any(Number),
        token: "valid.access.token",
      });
    });

    it("should set organizationId/membershipId/role to null when payload fields are absent", async () => {
      const req = makeReq({ authorization: "Bearer minimal.token" }) as Request & {
        user?: any;
      };
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-2",
        jti: "jti-2",
        type: "access",
        exp: Math.floor(Date.now() / 1000) + 3600,
        // No organizationId, membershipId, role
      });
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: "user-2",
        organizationId: null,
        membershipId: null,
        role: null,
      });
    });

    it("should call next() exactly once on success", async () => {
      const req = makeReq({ authorization: "Bearer valid.access.token" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-1",
        jti: "jti-ok",
        type: "access",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should query the Redis blacklist with the correct key", async () => {
      const req = makeReq({ authorization: "Bearer my.access.token" });
      const next = makeNext();

      (verifyToken as jest.Mock).mockReturnValue({
        sub: "user-1",
        jti: "unique-jti-abc",
        type: "access",
        exp: 9999999999,
      });
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authMiddleware(req as Request, makeRes() as Response, next);

      expect(redisClient.get).toHaveBeenCalledWith("blacklist:unique-jti-abc");
    });
  });
});
