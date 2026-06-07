import { NextFunction, Request, Response } from "express";

import ApiError from "../../utils/ApiError.js";
import { inventoryRepository } from "./inventory.repository.js";

export const inventoryItemContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const productId = req.params.productId as string | undefined;
  if (!productId) {
    return next();
  }

  const item = await inventoryRepository.findInventoryItem(
    req.organization!.id,
    productId,
  );
  if (!item) {
    return next(new ApiError(404, "Inventory item not found"));
  }

  req.body.inventoryItem = item;
  return next();
};
