
import { NextFunction, Request, Response } from "express";

export const reportContextMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  return next();
};
