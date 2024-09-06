import { jest } from "@jest/globals";

// Mocking dependencies
import { customerRepository } from "../../../src/modules/customers/customer.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/modules/customers/customer.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    CUSTOMER_CREATED: "customer.created",
    CUSTOMER_UPDATED: "customer.updated",
    CUSTOMER_ARCHIVED: "customer.archived",
  },
  AUDIT_ENTITY_TYPES: {
    CUSTOMER: "customer",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = [
    [{ id: "inv1" }], // invoices
    [{ id: "pay1" }], // payments
    { _sum: { totalAmount: 100 } }, // invoiceTotals
    { _sum: { amount: 50 } }, // paymentTotals
  ];
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (ops: any) => mockTx),
      invoice: { findMany: jest.fn(), aggregate: jest.fn() },
      payment: { findMany: jest.fn(), aggregate: jest.fn() },
    },
  };
});

import { customerService } from "../../../src/modules/customers/customer.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("customerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCustomer", () => {
    it("should create customer and log audit", async () => {
      (customerRepository.createCustomer as jest.Mock).mockResolvedValue({ id: "c1" });

      const result = await customerService.createCustomer("o1", "u1", { name: "Test" });

      expect(customerRepository.createCustomer).toHaveBeenCalledWith("o1", { name: "Test" });
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("c1");
    });
  });

  describe("updateCustomer", () => {
    it("should throw 404 if customer not found", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(customerService.updateCustomer("o1", "u1", "c1", {})).rejects.toThrow(ApiError);
    });

    it("should update customer and log audit", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue({ id: "c1" });
      (customerRepository.updateCustomer as jest.Mock).mockResolvedValue({ id: "c1", name: "New" });

      const result = await customerService.updateCustomer("o1", "u1", "c1", { name: "New" });

      expect(customerRepository.updateCustomer).toHaveBeenCalledWith("o1", "c1", { name: "New" });
      expect(auditService.record).toHaveBeenCalled();
      expect(result.name).toBe("New");
    });
  });

  describe("archiveCustomer", () => {
    it("should throw 404 if customer not found", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(customerService.archiveCustomer("o1", "u1", "c1")).rejects.toThrow(ApiError);
    });

    it("should archive customer", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue({ id: "c1" });
      
      await customerService.archiveCustomer("o1", "u1", "c1");

      expect(customerRepository.archiveCustomer).toHaveBeenCalledWith("o1", "c1");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listCustomers", () => {
    it("should list customers", async () => {
      (customerRepository.listCustomers as jest.Mock).mockResolvedValue([{ id: "c1" }]);
      const result = await customerService.listCustomers("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });

  describe("getLedger", () => {
    it("should throw 404 if customer not found", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(customerService.getLedger("o1", "c1")).rejects.toThrow(ApiError);
    });

    it("should calculate outstanding and credit balances correctly", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue({ id: "c1", name: "Test" });
      
      // The Prisma mock returns 100 invoiced, 50 paid
      const result = await customerService.getLedger("o1", "c1");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.outstandingBalance).toBe(50);
      expect(result.creditBalance).toBe(0);
      expect(result.customer.name).toBe("Test");
    });
  });
});
