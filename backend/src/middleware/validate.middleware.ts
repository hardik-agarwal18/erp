
import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

import ApiError from "../utils/ApiError.js";

const replaceObjectValues = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) => {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });

  Object.entries(source).forEach(([key, value]) => {
    target[key] = value;
  });
};

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      headers: req.headers,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      return next(
        new ApiError(400, "Validation error", parsed.error.flatten()),
      );
    }

    const data = parsed.data as {
      body?: Request["body"];
      headers?: Request["headers"];
      query?: Request["query"];
      params?: Request["params"];
    };

    req.body = data.body ?? req.body;
    if (data.headers) {
      replaceObjectValues(
        req.headers as Record<string, unknown>,
        data.headers as Record<string, unknown>,
      );
    }
    if (data.query) {
      replaceObjectValues(
        req.query as Record<string, unknown>,
        data.query as Record<string, unknown>,
      );
    }
    if (data.params) {
      replaceObjectValues(
        req.params as Record<string, unknown>,
        data.params as Record<string, unknown>,
      );
    }

    return next();
  };
};
