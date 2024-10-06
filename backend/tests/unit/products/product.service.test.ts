import { jest } from "@jest/globals";

// Mocking dependencies
import { productRepository } from "../../../src/modules/products/product.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/modules/products/product.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    PRODUCT_CREATED: "product.created",
    PRODUCT_UPDATED: "product.updated",
    PRODUCT_ARCHIVED: "product.archived",
    CATEGORY_CREATED: "category.created",
    CATEGORY_UPDATED: "category.updated",
    CATEGORY_ARCHIVED: "category.archived",
  },
  AUDIT_ENTITY_TYPES: {
    PRODUCT: "product",
    CATEGORY: "category",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    product: { create: jest.fn(), update: jest.fn() },
    inventoryItem: { create: jest.fn(), findFirst: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      tax: { findFirst: jest.fn() },
      productCategory: { findFirst: jest.fn() },
    },
  };
});

import { productService } from "../../../src/modules/products/product.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    it("should throw 404 if category not found", async () => {
      (prisma.productCategory.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(productService.createProduct("o1", "u1", { name: "Test", categoryId: "c1" })).rejects.toThrow(ApiError);
    });

    it("should throw 404 if tax not found", async () => {
      (prisma.productCategory.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });
      (prisma.tax.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(productService.createProduct("o1", "u1", { name: "Test", taxId: "t1" })).rejects.toThrow(ApiError);
    });

    it("should create product and log audit", async () => {
      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          product: { create: jest.fn().mockResolvedValue({ id: "p1" }) },
          inventoryItem: { create: jest.fn() },
        };
        return cb(capturedTx);
      });

      const result = await productService.createProduct("o1", "u1", { name: "Test", type: "PHYSICAL" });

      expect(capturedTx.product.create).toHaveBeenCalled();
      expect(capturedTx.inventoryItem.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("p1");
    });
  });

  describe("updateProduct", () => {
    it("should throw 404 if product not found", async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(productService.updateProduct("o1", "u1", "p1", {})).rejects.toThrow(ApiError);
    });

    it("should update product and log audit", async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue({ id: "p1" });

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          product: { update: jest.fn().mockResolvedValue({ id: "p1", name: "New" }) },
          inventoryItem: { create: jest.fn(), findFirst: jest.fn().mockResolvedValue(null) },
        };
        return cb(capturedTx);
      });

      const result = await productService.updateProduct("o1", "u1", "p1", { name: "New", type: "PHYSICAL" });

      expect(capturedTx.product.update).toHaveBeenCalled();
      expect(capturedTx.inventoryItem.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.name).toBe("New");
    });
  });

  describe("archiveProduct", () => {
    it("should throw 404 if product not found", async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(productService.archiveProduct("o1", "u1", "p1")).rejects.toThrow(ApiError);
    });

    it("should archive product", async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue({ id: "p1" });
      
      await productService.archiveProduct("o1", "u1", "p1");

      expect(productRepository.archiveProduct).toHaveBeenCalledWith("o1", "p1");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listProducts", () => {
    it("should list products", async () => {
      (productRepository.listProducts as jest.Mock).mockResolvedValue([{ id: "p1" }]);
      const result = await productService.listProducts("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });

  // Category tests
  describe("createCategory", () => {
    it("should create category", async () => {
      (productRepository.createCategory as jest.Mock).mockResolvedValue({ id: "c1" });
      const result = await productService.createCategory("o1", "u1", { name: "Test" });
      expect(result.id).toBe("c1");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    it("should throw 404 if category not found", async () => {
      (productRepository.findCategoryById as jest.Mock).mockResolvedValue(null);
      await expect(productService.updateCategory("o1", "u1", "c1", {})).rejects.toThrow(ApiError);
    });

    it("should update category", async () => {
      (productRepository.findCategoryById as jest.Mock).mockResolvedValue({ id: "c1" });
      (productRepository.updateCategory as jest.Mock).mockResolvedValue({ id: "c1", name: "New" });

      const result = await productService.updateCategory("o1", "u1", "c1", { name: "New" });
      expect(result.name).toBe("New");
    });
  });

  describe("archiveCategory", () => {
    it("should throw 404 if category not found", async () => {
      (productRepository.findCategoryById as jest.Mock).mockResolvedValue(null);
      await expect(productService.archiveCategory("o1", "u1", "c1")).rejects.toThrow(ApiError);
    });

    it("should archive category", async () => {
      (productRepository.findCategoryById as jest.Mock).mockResolvedValue({ id: "c1" });
      await productService.archiveCategory("o1", "u1", "c1");
      expect(productRepository.archiveCategory).toHaveBeenCalled();
    });
  });

  describe("listCategories", () => {
    it("should list categories", async () => {
      (productRepository.listCategories as jest.Mock).mockResolvedValue([{ id: "c1" }]);
      const result = await productService.listCategories("o1", undefined, {});
      expect(result).toHaveLength(1);
    });
  });

});
