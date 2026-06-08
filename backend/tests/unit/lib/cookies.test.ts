import { jest } from "@jest/globals";
import { Response } from "express";

// ── Mock env and auth constants ──────────────────────────────────────────────
jest.mock("../../../src/config/env.js", () => ({
  env: { NODE_ENV: "production" },
}));

jest.mock("../../../src/modules/auth/auth.constants.js", () => ({
  REFRESH_COOKIE_NAME: "refreshToken",
  CSRF_COOKIE_NAME: "csrfToken",
  REFRESH_TOKEN_EXPIRES_IN: 604800, // 7 days in seconds
}));

import { setAuthCookies, clearAuthCookies } from "../../../src/lib/cookies.js";

function makeRes() {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

describe("cookies library", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("setAuthCookies", () => {
    it("should set refreshToken cookie with correct options in production", () => {
      const res = makeRes();

      setAuthCookies(res as Response, "refresh-token-value", "csrf-token-value");

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-value",
        expect.objectContaining({
          httpOnly: true,
          secure: true,        // production = true
          sameSite: "strict",
          maxAge: 604800 * 1000,
          path: "/api/v1/auth",
        }),
      );
    });

    it("should set csrfToken cookie with httpOnly: false", () => {
      const res = makeRes();

      setAuthCookies(res as Response, "refresh-token", "csrf-token");

      expect(res.cookie).toHaveBeenCalledWith(
        "csrfToken",
        "csrf-token",
        expect.objectContaining({
          httpOnly: false,
          secure: true,
          sameSite: "strict",
          maxAge: 604800 * 1000,
          path: "/",
        }),
      );
    });

    it("should call res.cookie exactly twice", () => {
      const res = makeRes();
      setAuthCookies(res as Response, "r", "c");
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearAuthCookies", () => {
    it("should clear refreshToken cookie with correct path", () => {
      const res = makeRes();

      clearAuthCookies(res as Response);

      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", { path: "/api/v1/auth" });
    });

    it("should clear csrfToken cookie with correct path", () => {
      const res = makeRes();

      clearAuthCookies(res as Response);

      expect(res.clearCookie).toHaveBeenCalledWith("csrfToken", { path: "/" });
    });

    it("should call res.clearCookie exactly twice", () => {
      const res = makeRes();
      clearAuthCookies(res as Response);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
