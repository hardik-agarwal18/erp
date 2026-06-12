// @ts-nocheck
import { NextFunction, Request, Response } from "express";

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

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      sanitized[key] = sanitizeValue(val);
    });
    return sanitized;
  }

  return value;
};

export const sanitizeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.body = sanitizeValue(req.body) as Request["body"];

  replaceObjectValues(
    req.query as Record<string, unknown>,
    sanitizeValue(req.query) as Record<string, unknown>,
  );
  replaceObjectValues(
    req.params as Record<string, unknown>,
    sanitizeValue(req.params) as Record<string, unknown>,
  );

  next();
};
