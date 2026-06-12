import { jest } from "@jest/globals";

// Mocking dependencies
import { expenseRepository } from "../../../src/domains/financials/expenses/expense.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/domains/financials/expenses/expense.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    EXPENSE_CREATED: "expense.created",
  },
  AUDIT_ENTITY_TYPES: {
    EXPENSE: "expense",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    expense: { create: jest.fn() },
    transaction: { create: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      vendor: { findFirst: jest.fn() },
    },
  };
});

import { expenseService } from "../../../src/domains/financials/expenses/expense.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("expenseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createExpense", () => {
    it("should throw 404 if vendor not found", async () => {
      (prisma.vendor.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(expenseService.createExpense("o1", "u1", { vendorId: "v1", amount: 100 } as any)).rejects.toThrow(ApiError);
    });

    it("should create expense and transaction", async () => {
      (prisma.vendor.findFirst as jest.Mock).mockResolvedValue({ id: "v1" });

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          expense: { create: jest.fn().mockResolvedValue({ id: "e1" }) },
          transaction: { create: jest.fn() },
        };
        return cb(capturedTx);
      });

      const result = await expenseService.createExpense("o1", "u1", { vendorId: "v1", amount: 100, expenseDate: new Date(), category: "Meals", description: "Lunch" });

      expect(capturedTx.expense.create).toHaveBeenCalled();
      expect(capturedTx.transaction.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("e1");
    });
  });

  describe("listExpenses", () => {
    it("should list expenses", async () => {
      (expenseRepository.listExpenses as jest.Mock).mockResolvedValue([{ id: "e1" }]);
      const result = await expenseService.listExpenses("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });
});
