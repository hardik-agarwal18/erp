import { NextFunction, Request, Response } from "express";

import ApiError from "../../utils/ApiError.js";
import { invoiceRepository } from "./invoice.repository.js";

export const invoiceContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const invoiceId = req.params.id as string | undefined;
  if (!invoiceId) {
    return next();
  }

  const invoice = await invoiceRepository.findById(
    req.organization!.id,
    invoiceId,
  );
  if (!invoice) {
    return next(new ApiError(404, "Invoice not found"));
  }

  req.body.invoice = invoice;
  return next();
};
