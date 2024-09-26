import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../../src/middleware/validate.middleware.js";
import ApiError from "../../../src/utils/ApiError.js";

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

describe("validate middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Valid schema", () => {
    it("should call next() without error when schema passes", () => {
      const schema = z.object({
        body: z.object({ name: z.string() }),
      });

      const req = {
        body: { name: "John" },
        headers: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it("should mutate req.body with parsed (coerced) data from schema", () => {
      const schema = z.object({
        body: z.object({ count: z.number() }),
      });

      const req = {
        body: { count: 5 },
        headers: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.count).toBe(5);
      expect(next).toHaveBeenCalledWith();
    });

    it("should update req.query in-place when schema includes query", () => {
      const schema = z.object({
        query: z.object({ page: z.string() }),
      });

      const req = {
        body: {},
        headers: {},
        query: { page: "2" },
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect((req.query as any).page).toBe("2");
      expect(next).toHaveBeenCalledWith();
    });

    it("should update req.params in-place when schema includes params", () => {
      const schema = z.object({
        params: z.object({ id: z.string() }),
      });

      const req = {
        body: {},
        headers: {},
        query: {},
        params: { id: "uuid-1" },
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect((req.params as any).id).toBe("uuid-1");
      expect(next).toHaveBeenCalledWith();
    });

    it("should not modify req.body when schema does not have a body field", () => {
      const schema = z.object({
        query: z.object({ page: z.string() }),
      });

      const req = {
        body: { existing: "value" },
        headers: {},
        query: { page: "1" },
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.existing).toBe("value");
    });
  });

  describe("Invalid schema", () => {
    it("should call next(ApiError 400) when body validation fails", () => {
      const schema = z.object({
        body: z.object({ name: z.string().min(1) }),
      });

      const req = {
        body: { name: "" },
        headers: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0] as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Validation error");
    });

    it("should call next(ApiError 400) when body is missing a required field", () => {
      const schema = z.object({
        body: z.object({ email: z.string().email() }),
      });

      const req = {
        body: {},
        headers: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(400);
    });

    it("should include flatten() validation details in the ApiError", () => {
      const schema = z.object({
        body: z.object({ age: z.number() }),
      });

      const req = {
        body: { age: "not-a-number" },
        headers: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.details).toBeDefined();
    });

    it("should call next(ApiError 400) when query validation fails", () => {
      const schema = z.object({
        query: z.object({ page: z.string().regex(/^\d+$/, "page must be a digit string") }),
      });

      const req = {
        body: {},
        headers: {},
        query: { page: "abc" },
        params: {},
      } as unknown as Request;
      const next = makeNext();

      validate(schema)(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
    });
  });
});
