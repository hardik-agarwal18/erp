// @ts-nocheck
import { NextFunction, Request, Response } from "express";

export const paymentContextMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  return next();
};
