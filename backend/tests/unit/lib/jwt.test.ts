import { jest } from "@jest/globals";

// ── Hoist mock fns before any imports ────────────────────────────────────────
const mockSign = jest.fn();
const mockVerify = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: { sign: mockSign, verify: mockVerify },
}));

import { signToken, verifyToken } from "../../../src/lib/jwt.js";

describe("jwt library", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("signToken", () => {
    it("should call jwt.sign with the correct arguments and return a token", () => {
      mockSign.mockReturnValue("signed.token.here");

      const payload = { sub: "user-1", type: "access" };
      const result = signToken(payload, "secret", { expiresIn: "15m" });

      expect(mockSign).toHaveBeenCalledWith(payload, "secret", { expiresIn: "15m" });
      expect(result).toBe("signed.token.here");
    });

    it("should pass algorithm option through to jwt.sign", () => {
      mockSign.mockReturnValue("token");

      signToken({ sub: "u1" }, "secret", { algorithm: "HS256", expiresIn: "1h" });

      expect(mockSign).toHaveBeenCalledWith(
        { sub: "u1" },
        "secret",
        { algorithm: "HS256", expiresIn: "1h" },
      );
    });

    it("should propagate errors thrown by jwt.sign", () => {
      mockSign.mockImplementation(() => { throw new Error("Signing failed"); });
      expect(() => signToken({ sub: "u1" }, "", {})).toThrow("Signing failed");
    });
  });

  describe("verifyToken", () => {
    it("should return the decoded payload for a valid token", () => {
      const decoded = { sub: "user-1", type: "access", jti: "abc" };
      mockVerify.mockReturnValue(decoded);

      const result = verifyToken<typeof decoded>("valid.token", "secret");

      expect(mockVerify).toHaveBeenCalledWith("valid.token", "secret");
      expect(result).toEqual(decoded);
    });

    it("should throw TokenExpiredError when token is expired", () => {
      mockVerify.mockImplementation(() => {
        const err = new Error("jwt expired"); err.name = "TokenExpiredError"; throw err;
      });
      expect(() => verifyToken("expired.token", "secret")).toThrow("jwt expired");
    });

    it("should throw JsonWebTokenError for invalid signature", () => {
      mockVerify.mockImplementation(() => {
        const err = new Error("invalid signature"); err.name = "JsonWebTokenError"; throw err;
      });
      expect(() => verifyToken("tampered.token", "secret")).toThrow("invalid signature");
    });

    it("should throw when token is malformed", () => {
      mockVerify.mockImplementation(() => { throw new Error("jwt malformed"); });
      expect(() => verifyToken("not-a-jwt", "secret")).toThrow("jwt malformed");
    });

    it("should throw when using a wrong secret", () => {
      mockVerify.mockImplementation(() => { throw new Error("invalid signature"); });
      expect(() => verifyToken("token", "wrong-secret")).toThrow("invalid signature");
    });

    it("should throw NotBeforeError when token not yet valid", () => {
      mockVerify.mockImplementation(() => {
        const err = new Error("jwt not active"); err.name = "NotBeforeError"; throw err;
      });
      expect(() => verifyToken("future.token", "secret")).toThrow("jwt not active");
    });
  });
});
