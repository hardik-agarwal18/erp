import { NextFunction, Request, Response } from "express";

import ApiError from "../../utils/ApiError.js";
import { taxRepository } from "./tax.repository.js";

export const taxContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const taxId = req.params.id as string | undefined;
  if (!taxId) {
    return next();
  }

  const tax = await taxRepository.findById(req.organization!.id, taxId);
  if (!tax) {
    return next(new ApiError(404, "Tax not found"));
  }

  req.body.tax = tax;
  return next();
};
