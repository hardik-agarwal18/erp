import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { requireRefreshToken } from "../../../src/modules/auth/auth.middleware.js";
import ApiError from "../../../src/utils/ApiError.js";
import { REFRESH_COOKIE_NAME } from "../../../src/modules/auth/auth.constants.js";

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

describe("requireRefreshToken", () => {
  describe("Refresh token cookie", () => {
    it("should call next(ApiError 401) when refresh cookie is absent", () => {
      const req = {
        cookies: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      requireRefreshToken(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Refresh token missing");
    });

    it("should call next(ApiError 401) when cookies is null/undefined", () => {
      const req = {
        cookies: undefined,
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      requireRefreshToken(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(401);
    });
  });

  describe("CSRF token header", () => {
    it("should call next(ApiError 403) when CSRF token header is missing", () => {
      const req = {
        cookies: { [REFRESH_COOKIE_NAME]: "valid-refresh-token" },
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      requireRefreshToken(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("CSRF token missing");
    });
  });

  describe("Happy path", () => {
    it("should call next() with no error when both cookies are present", () => {
      const req = {
        cookies: { [REFRESH_COOKIE_NAME]: "valid-refresh-token" },
        headers: { "x-csrf-token": "valid-csrf-token" },
      } as unknown as Request;
      const next = makeNext();

      requireRefreshToken(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
