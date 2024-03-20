import { NextFunction, Request, Response } from "express";

import ApiError from "../../utils/ApiError.js";
import { productRepository } from "./product.repository.js";

export const productContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const productId = req.params.id as string | undefined;
  if (!productId) {
    return next();
  }

  const product = await productRepository.findById(
    req.organization!.id,
    productId,
  );
  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  req.body.product = product;
  return next();
};
