import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../../src/utils/asyncHandler.js";

function makeReq(): Partial<Request> {
  return {} as Partial<Request>;
}

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

describe("asyncHandler", () => {
  describe("Successful handler", () => {
    it("should call the wrapped handler with req, res, next", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(handler as any);
      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      wrapped(req as Request, res as Response, next as unknown as NextFunction);

      // Give the promise a tick to resolve
      await new Promise((r) => setTimeout(r, 0));

      expect(handler).toHaveBeenCalledWith(req, res, next);
    });

    it("should NOT call next when the handler resolves successfully", async () => {
      const handler = jest.fn().mockResolvedValue("result");
      const wrapped = asyncHandler(handler as any);
      const next = makeNext();

      wrapped(makeReq() as Request, makeRes() as Response, next as unknown as NextFunction);

      await new Promise((r) => setTimeout(r, 0));

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Failing handler", () => {
    it("should call next(error) when the handler rejects with an Error", async () => {
      const error = new Error("async failure");
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(handler as any);
      const next = makeNext();

      wrapped(makeReq() as Request, makeRes() as Response, next as unknown as NextFunction);

      await new Promise((r) => setTimeout(r, 0));

      expect(next).toHaveBeenCalledWith(error);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should call next(error) when handler throws synchronously via Promise.resolve", async () => {
      const error = new Error("sync throw");
      const handler = jest.fn().mockImplementation(() => Promise.reject(error));
      const wrapped = asyncHandler(handler as any);
      const next = makeNext();

      wrapped(makeReq() as Request, makeRes() as Response, next as unknown as NextFunction);

      await new Promise((r) => setTimeout(r, 0));

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should propagate non-Error rejection values", async () => {
      const handler = jest.fn().mockRejectedValue("plain string error");
      const wrapped = asyncHandler(handler as any);
      const next = makeNext();

      wrapped(makeReq() as Request, makeRes() as Response, next as unknown as NextFunction);

      await new Promise((r) => setTimeout(r, 0));

      expect(next).toHaveBeenCalledWith("plain string error");
    });
  });
});
