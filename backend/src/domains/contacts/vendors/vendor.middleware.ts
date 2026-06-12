
import { NextFunction, Request, Response } from "express";

import ApiError from "../../../utils/ApiError.js";
import { vendorRepository } from "./vendor.repository.js";

export const vendorContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const vendorId = req.params.id as string | undefined;
  if (!vendorId) {
    return next();
  }

  const vendor = await vendorRepository.findById(
    req.organization!.id,
    vendorId,
  );
  if (!vendor) {
    return next(new ApiError(404, "Vendor not found"));
  }

  req.body.vendor = vendor;
  return next();
};
