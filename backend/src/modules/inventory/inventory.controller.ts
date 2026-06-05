import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

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
  listMovements: async (req: Request, res: Response) => {
    const movements = await inventoryService.listMovements(
      req.organization!.id,
      req.query.productId as string | undefined,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: movements });
  },
  adjustStock: async (req: Request, res: Response) => {
    const result = await inventoryService.adjustStock(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: result });
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
