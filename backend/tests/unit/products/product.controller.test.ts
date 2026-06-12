import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { productController } from "../../../src/domains/inventory/products/product.controller.js";
import { productService } from "../../../src/domains/inventory/products/product.service.js";

jest.mock("../../../src/domains/inventory/products/product.service.js");

describe("productController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      organization: { id: "o1" } as any,
      user: { id: "u1" } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should create product", async () => {
    req.body = { name: "Test Product" };
    (productService.createProduct as jest.Mock).mockResolvedValue({ id: "p1", name: "Test Product" });

    await productController.createProduct(req as Request, res as Response);

    expect(productService.createProduct).toHaveBeenCalledWith("o1", "u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "p1", name: "Test Product" } }));
  });

  it("should update product", async () => {
    req.params = { id: "p1" };
    req.body = { name: "Updated" };
    (productService.updateProduct as jest.Mock).mockResolvedValue({ id: "p1", name: "Updated" });

    await productController.updateProduct(req as Request, res as Response);

    expect(productService.updateProduct).toHaveBeenCalledWith("o1", "u1", "p1", req.body);
  });

  it("should archive product", async () => {
    req.params = { id: "p1" };

    await productController.archiveProduct(req as Request, res as Response);

    expect(productService.archiveProduct).toHaveBeenCalledWith("o1", "u1", "p1");
  });

  it("should list products", async () => {
    req.query = { search: "test", type: "PHYSICAL" };
    (productService.listProducts as jest.Mock).mockResolvedValue({ data: [{ id: "p1" }], meta: {} });

    await productController.listProducts(req as Request, res as Response);

    expect(productService.listProducts).toHaveBeenCalledWith("o1", { search: "test", type: "PHYSICAL", categoryId: undefined }, req.query);
  });

  it("should create category", async () => {
    req.body = { name: "Test Category" };
    (productService.createCategory as jest.Mock).mockResolvedValue({ id: "c1", name: "Test Category" });

    await productController.createCategory(req as Request, res as Response);

    expect(productService.createCategory).toHaveBeenCalledWith("o1", "u1", req.body);
  });

  it("should update category", async () => {
    req.params = { id: "c1" };
    req.body = { name: "Updated" };
    (productService.updateCategory as jest.Mock).mockResolvedValue({ id: "c1", name: "Updated" });

    await productController.updateCategory(req as Request, res as Response);

    expect(productService.updateCategory).toHaveBeenCalledWith("o1", "u1", "c1", req.body);
  });

  it("should archive category", async () => {
    req.params = { id: "c1" };

    await productController.archiveCategory(req as Request, res as Response);

    expect(productService.archiveCategory).toHaveBeenCalledWith("o1", "u1", "c1");
  });

  it("should list categories", async () => {
    req.query = { search: "test" };
    (productService.listCategories as jest.Mock).mockResolvedValue({ data: [{ id: "c1" }], meta: {} });

    await productController.listCategories(req as Request, res as Response);

    expect(productService.listCategories).toHaveBeenCalledWith("o1", "test", req.query);
  });
});
