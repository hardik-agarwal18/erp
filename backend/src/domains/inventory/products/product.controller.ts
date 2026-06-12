
import { sendSuccess } from "../../../utils/apiResponse.js";
import { Request, Response } from "express";

import { productService } from "./product.service.js";

export const productController = {
  createProduct: async (req: Request, res: Response) => {
    const product = await productService.createProduct(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: product });
  },
  updateProduct: async (req: Request, res: Response) => {
    const product = await productService.updateProduct(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: product });
  },
  archiveProduct: async (req: Request, res: Response) => {
    await productService.archiveProduct(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Product archived" });
  },
  listProducts: async (req: Request, res: Response) => {
    const products = await productService.listProducts(
      req.organization!.id,
      {
        search: req.query.search as string | undefined,
        type: req.query.type as "PHYSICAL" | "SERVICE" | undefined,
        categoryId: req.query.categoryId as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: products });
  },
  getProduct: async (req: Request, res: Response) => {
    const product = await productService.getProduct(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: product });
  },
  createCategory: async (req: Request, res: Response) => {
    const category = await productService.createCategory(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: category });
  },
  updateCategory: async (req: Request, res: Response) => {
    const category = await productService.updateCategory(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: category });
  },
  archiveCategory: async (req: Request, res: Response) => {
    await productService.archiveCategory(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Category archived" });
  },
  listCategories: async (req: Request, res: Response) => {
    const categories = await productService.listCategories(
      req.organization!.id,
      req.query.search as string | undefined,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: categories });
  },
};
