import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

// ── Hoist mock fns ────────────────────────────────────────────────────────────
const mockLoggerError = jest.fn();
const mockSendError = jest.fn();

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { error: mockLoggerError, info: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../../src/utils/apiResponse.js", () => ({
  sendError: mockSendError,
}));

import { errorMiddleware } from "../../../src/middleware/error.middleware.js";
import ApiError from "../../../src/utils/ApiError.js";

function makeRes(): Partial<Response> { return {} as Partial<Response>; }
function makeReq(): Partial<Request> { return {} as Partial<Request>; }
function makeNext(): NextFunction { return jest.fn() as unknown as NextFunction; }

describe("errorMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("ApiError handling", () => {
    it("should call sendError with correct statusCode and message for an ApiError", () => {
      const err = new ApiError(404, "Resource not found");

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusCode: 404, message: "Resource not found" }),
      );
    });

    it("should NOT call logger.error for an ApiError", () => {
      const err = new ApiError(400, "Bad request");

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it("should include array details in errors field when details is an array", () => {
      const details = [{ field: "email", message: "invalid" }];
      const err = new ApiError(422, "Validation error", details);

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ errors: details }),
      );
    });

    it("should wrap non-array details in an array", () => {
      const details = { field: "email", message: "invalid" };
      const err = new ApiError(422, "Validation error", details);

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ errors: [details] }),
      );
    });

    it("should pass empty errors array when ApiError has no details", () => {
      const err = new ApiError(403, "Forbidden");

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ errors: [] }),
      );
    });
  });

  describe("Generic Error handling", () => {
    it("should default to 500 status for a non-ApiError", () => {
      const err = new Error("Something broke");

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusCode: 500, message: "Internal server error" }),
      );
    });

    it("should log error details via logger.error for unknown errors", () => {
      const err = new Error("Unexpected crash");
      err.stack = "Error: Unexpected crash\n  at test.ts:1";

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockLoggerError).toHaveBeenCalledWith(
        { errorMessage: "Unexpected crash", errorStack: err.stack },
        "Unhandled error details",
      );
    });

    it("should send empty errors array for unknown errors", () => {
      const err = new Error("DB crash");

      errorMiddleware(err, makeReq() as Request, makeRes() as Response, makeNext());

      expect(mockSendError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ errors: [] }),
      );
    });
  });
});
