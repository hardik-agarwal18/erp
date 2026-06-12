import { jest } from "@jest/globals";

// Mocking dependencies
import { inventoryRepository } from "../../../src/domains/inventory/inventory/inventory.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/domains/inventory/inventory/inventory.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    INVENTORY_ADJUSTED: "inventory.adjusted",
    INVENTORY_TRANSFERRED: "inventory.transferred",
  },
  AUDIT_ENTITY_TYPES: {
    INVENTORY_ITEM: "inventory_item",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {};
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
    },
  };
});

import { inventoryService } from "../../../src/domains/inventory/inventory/inventory.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("inventoryService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
  });

  describe("listItems", () => {
    it("should list items", async () => {
      (inventoryRepository.listItems as jest.Mock).mockResolvedValue([{ id: "i1" }]);
      const result = await inventoryService.listItems("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });

  describe("listMovements", () => {
    it("should list movements", async () => {
      (inventoryRepository.listMovements as jest.Mock).mockResolvedValue([{ id: "m1" }]);
      const result = await inventoryService.listMovements("o1", "p1", {});
      expect(result).toHaveLength(1);
    });
  });

  describe("adjustStock", () => {
    it("should throw 404 if product not found", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue(null);
      await expect(inventoryService.adjustStock("o1", "u1", { productId: "p1", quantity: 5 })).rejects.toThrow(ApiError);
    });

    it("should throw 400 if product is not physical", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue({ id: "p1", type: "SERVICE" });
      await expect(inventoryService.adjustStock("o1", "u1", { productId: "p1", quantity: 5 })).rejects.toThrow(ApiError);
    });

    it("should create new inventory item if none exists and adjust stock", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue({ id: "p1", type: "PHYSICAL" });
      (inventoryRepository.findInventoryItemForUpdate as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "i1" });
      (inventoryRepository.createInventoryItem as jest.Mock).mockResolvedValue({ id: "i1" });
      (inventoryRepository.createInventoryMovement as jest.Mock).mockResolvedValue({ id: "m1" });

      const result = await inventoryService.adjustStock("o1", "u1", { productId: "p1", quantity: 5 });

      expect(inventoryRepository.createInventoryItem).toHaveBeenCalled();
      expect(inventoryRepository.createFinancialTransaction).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.item.id).toBe("i1");
      expect(result.movement.id).toBe("m1");
    });

    it("should increment existing inventory item and adjust stock", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue({ id: "p1", type: "PHYSICAL" });
      (inventoryRepository.findInventoryItemForUpdate as jest.Mock).mockResolvedValueOnce({ id: "i1" }).mockResolvedValueOnce({ id: "i1" });
      (inventoryRepository.createInventoryMovement as jest.Mock).mockResolvedValue({ id: "m1" });

      const result = await inventoryService.adjustStock("o1", "u1", { productId: "p1", quantity: 5 });

      expect(inventoryRepository.incrementInventoryItem).toHaveBeenCalled();
      expect(inventoryRepository.createFinancialTransaction).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.item.id).toBe("i1");
    });
  });

  describe("transferStock", () => {
    it("should throw 400 if insufficient stock", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue({ id: "p1", type: "PHYSICAL" });
      (inventoryRepository.findInventoryItemForUpdate as jest.Mock).mockResolvedValue({ id: "i1", quantity: 2 });

      await expect(inventoryService.transferStock("o1", "u1", { productId: "p1", quantity: 5 })).rejects.toThrow(ApiError);
    });

    it("should transfer stock", async () => {
      (inventoryRepository.findProductById as jest.Mock).mockResolvedValue({ id: "p1", type: "PHYSICAL" });
      (inventoryRepository.findInventoryItemForUpdate as jest.Mock).mockResolvedValueOnce({ id: "i1", quantity: 10 }).mockResolvedValueOnce({ id: "i1", quantity: 5 });
      (inventoryRepository.createInventoryMovement as jest.Mock).mockResolvedValue({ id: "m1" });

      const result = await inventoryService.transferStock("o1", "u1", { productId: "p1", quantity: 5 });

      expect(inventoryRepository.decrementInventoryItem).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.movement.id).toBe("m1");
    });
  });
});
