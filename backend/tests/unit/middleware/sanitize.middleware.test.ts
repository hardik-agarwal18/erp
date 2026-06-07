import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { sanitizeMiddleware } from "../../../src/middleware/sanitize.middleware.js";

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

describe("sanitizeMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Body sanitization", () => {
    it("should strip null bytes from string values in body", () => {
      const req = {
        body: { name: "hello\0world" },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.name).toBe("helloworld");
    });

    it("should trim whitespace from string values in body", () => {
      const req = {
        body: { name: "  hello  " },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.name).toBe("hello");
    });

    it("should sanitize nested objects recursively", () => {
      const req = {
        body: { user: { name: "  test\0user  ", email: "  test@test.com  " } },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.user.name).toBe("testuser");
      expect(req.body.user.email).toBe("test@test.com");
    });

    it("should sanitize arrays recursively", () => {
      const req = {
        body: { tags: ["  tag1  ", "tag2\0", "  tag3  "] },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should handle an empty body without throwing", () => {
      const req = {
        body: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      expect(() =>
        sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction),
      ).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("should preserve non-string primitive values (numbers, booleans, null)", () => {
      const req = {
        body: { count: 42, active: true, deleted: null },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(req.body).toEqual({ count: 42, active: true, deleted: null });
    });
  });

  describe("Query sanitization", () => {
    it("should sanitize query params in-place", () => {
      const req = {
        body: {},
        query: { search: "  hello\0world  " },
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect((req.query as any).search).toBe("helloworld");
    });

    it("should handle empty query without throwing", () => {
      const req = {
        body: {},
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      expect(() =>
        sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction),
      ).not.toThrow();
    });
  });

  describe("Params sanitization", () => {
    it("should sanitize route params in-place", () => {
      const req = {
        body: {},
        query: {},
        params: { id: "  abc-\0def  " },
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect((req.params as any).id).toBe("abc-def");
    });
  });

  describe("Middleware behavior", () => {
    it("should always call next()", () => {
      const req = {
        body: { key: "value" },
        query: {},
        params: {},
      } as unknown as Request;
      const next = makeNext();

      sanitizeMiddleware(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // no error passed
    });
  });
});
