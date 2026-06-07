import { NextFunction, Request, Response } from "express";

export const transactionContextMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  return next();
};
