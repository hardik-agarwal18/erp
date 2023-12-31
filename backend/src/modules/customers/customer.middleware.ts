import { NextFunction, Request, Response } from "express";

import { customerRepository } from "./customer.repository.js";
import ApiError from "../../utils/ApiError.js";

export const customerContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const customerId = req.params.id as string | undefined;
  if (!customerId) {
    return next();
  }

  const customer = await customerRepository.findById(
    req.organization!.id,
    customerId,
  );
  if (!customer) {
    return next(new ApiError(404, "Customer not found"));
  }

  req.body.customer = customer;
  return next();
};
