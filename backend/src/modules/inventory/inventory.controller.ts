import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";
import ApiError from "../../utils/ApiError.js";
import { inventoryService } from "./inventory.service.js";

export const inventoryController = {
  listItems: async (req: Request, res: Response) => {
    const items = await inventoryService.listItems(
      req.organization!.id,
      {
        search: req.query.search as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: items });
  },
  getItem: async (req: Request, res: Response) => {
    const items = await inventoryService.listItems(
      req.organization!.id,
      { productId: req.params.productId },
      { limit: 1 }
    );
    if (!items.items.length) {
      throw new ApiError(404, "Item not found");
    }
    sendSuccess(res, { statusCode: 200, data: items.items[0] });
  },
  listMovements: async (req: Request, res: Response) => {
    const movements = await inventoryService.listMovements(
      req.organization!.id,
      req.query.productId as string | undefined,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: movements });
  },
  adjustStock: async (req: Request, res: Response) => {
    const payload = { ...req.body };
    const result = await inventoryService.adjustStock(
      req.organization!.id,
      req.user!.id,
      payload,
    );
    sendSuccess(res, { statusCode: 201, data: result });
  },
  transferStock: async (req: Request, res: Response) => {
    const result = await inventoryService.transferStock(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
