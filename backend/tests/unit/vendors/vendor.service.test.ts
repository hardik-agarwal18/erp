import { jest } from "@jest/globals";

// Mocking dependencies
import { vendorRepository } from "../../../src/domains/contacts/vendors/vendor.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/domains/contacts/vendors/vendor.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    VENDOR_CREATED: "vendor.created",
    VENDOR_UPDATED: "vendor.updated",
    VENDOR_ARCHIVED: "vendor.archived",
  },
  AUDIT_ENTITY_TYPES: {
    VENDOR: "vendor",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = [
    [{ id: "exp1" }], // expenses
    { _sum: { amount: 200 } }, // expenseTotals
  ];
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async () => mockTx),
      expense: { findMany: jest.fn(), aggregate: jest.fn() },
    },
  };
});

import { vendorService } from "../../../src/domains/contacts/vendors/vendor.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("vendorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createVendor", () => {
    it("should create vendor and log audit", async () => {
      (vendorRepository.createVendor as jest.Mock).mockResolvedValue({ id: "v1" });

      const result = await vendorService.createVendor("o1", "u1", { name: "Test Vendor" });

      expect(vendorRepository.createVendor).toHaveBeenCalledWith("o1", { name: "Test Vendor" });
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("v1");
    });
  });

  describe("updateVendor", () => {
    it("should throw 404 if vendor not found", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(vendorService.updateVendor("o1", "u1", "v1", {})).rejects.toThrow(ApiError);
    });

    it("should update vendor and log audit", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue({ id: "v1" });
      (vendorRepository.updateVendor as jest.Mock).mockResolvedValue({ id: "v1", name: "New" });

      const result = await vendorService.updateVendor("o1", "u1", "v1", { name: "New" });

      expect(vendorRepository.updateVendor).toHaveBeenCalledWith("o1", "v1", { name: "New" });
      expect(auditService.record).toHaveBeenCalled();
      expect(result.name).toBe("New");
    });
  });

  describe("archiveVendor", () => {
    it("should throw 404 if vendor not found", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(vendorService.archiveVendor("o1", "u1", "v1")).rejects.toThrow(ApiError);
    });

    it("should archive vendor", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue({ id: "v1" });
      
      await vendorService.archiveVendor("o1", "u1", "v1");

      expect(vendorRepository.archiveVendor).toHaveBeenCalledWith("o1", "v1");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listVendors", () => {
    it("should list vendors", async () => {
      (vendorRepository.listVendors as jest.Mock).mockResolvedValue([{ id: "v1" }]);
      const result = await vendorService.listVendors("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });

  describe("getLedger", () => {
    it("should throw 404 if vendor not found", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(vendorService.getLedger("o1", "v1")).rejects.toThrow(ApiError);
    });

    it("should return ledger data", async () => {
      (vendorRepository.findById as jest.Mock).mockResolvedValue({ id: "v1", name: "Test Vendor" });
      
      // The Prisma mock returns 200 total amount
      const result = await vendorService.getLedger("o1", "v1");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.totalPurchases).toBe(200);
      expect(result.vendor.name).toBe("Test Vendor");
    });
  });
});
