import { jest } from "@jest/globals";

// Mocking dependencies
import { taxRepository } from "../../../src/domains/financials/taxes/tax.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/domains/financials/taxes/tax.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    TAX_CREATED: "tax.created",
    TAX_UPDATED: "tax.updated",
    TAX_ARCHIVED: "tax.archived",
  },
  AUDIT_ENTITY_TYPES: {
    TAX: "tax",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    tax: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      tax: { updateMany: jest.fn() },
    },
  };
});

import { taxService } from "../../../src/domains/financials/taxes/tax.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("taxService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTax", () => {
    it("should create tax and log audit", async () => {
      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          tax: { create: jest.fn().mockResolvedValue({ id: "t1", isDefault: false }), updateMany: jest.fn() },
        };
        return cb(capturedTx);
      });

      const result = await taxService.createTax("o1", "u1", { name: "Test Tax", rate: 5, type: "PERCENTAGE" });

      expect(capturedTx.tax.create).toHaveBeenCalled();
      expect(capturedTx.tax.updateMany).not.toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("t1");
    });

    it("should enforce default tax if created as default", async () => {
      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          tax: { create: jest.fn().mockResolvedValue({ id: "t1", isDefault: true }), updateMany: jest.fn() },
        };
        return cb(capturedTx);
      });

      await taxService.createTax("o1", "u1", { name: "Test Tax", rate: 5, type: "PERCENTAGE", isDefault: true });

      expect(capturedTx.tax.create).toHaveBeenCalled();
      expect(capturedTx.tax.updateMany).toHaveBeenCalledWith({
        where: { organizationId: "o1", deletedAt: null, NOT: { id: "t1" } },
        data: { isDefault: false },
      });
    });
  });

  describe("updateTax", () => {
    it("should throw 404 if tax not found", async () => {
      (taxRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(taxService.updateTax("o1", "u1", "t1", {})).rejects.toThrow(ApiError);
    });

    it("should update tax and enforce default if needed", async () => {
      (taxRepository.findById as jest.Mock).mockResolvedValue({ id: "t1" });

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          tax: { update: jest.fn().mockResolvedValue({ id: "t1", name: "New", isDefault: true }), updateMany: jest.fn() },
        };
        return cb(capturedTx);
      });

      const result = await taxService.updateTax("o1", "u1", "t1", { name: "New", isDefault: true });

      expect(capturedTx.tax.update).toHaveBeenCalled();
      expect(capturedTx.tax.updateMany).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.name).toBe("New");
    });
  });

  describe("archiveTax", () => {
    it("should throw 404 if tax not found", async () => {
      (taxRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(taxService.archiveTax("o1", "u1", "t1")).rejects.toThrow(ApiError);
    });

    it("should archive tax", async () => {
      (taxRepository.findById as jest.Mock).mockResolvedValue({ id: "t1" });
      
      await taxService.archiveTax("o1", "u1", "t1");

      expect(taxRepository.archiveTax).toHaveBeenCalledWith("o1", "t1");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listTaxes", () => {
    it("should list taxes", async () => {
      (taxRepository.listTaxes as jest.Mock).mockResolvedValue([{ id: "t1" }]);
      const result = await taxService.listTaxes("o1", undefined, {});
      expect(result).toHaveLength(1);
    });
  });
});
