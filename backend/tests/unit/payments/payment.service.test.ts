import { jest } from "@jest/globals";

// Mocking dependencies
import { paymentRepository } from "../../../src/domains/financials/payments/payment.repository.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/domains/financials/payments/payment.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    PAYMENT_CREATED: "payment.created",
  },
  AUDIT_ENTITY_TYPES: {
    PAYMENT: "payment",
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

import { paymentService } from "../../../src/domains/financials/payments/payment.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("paymentService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
  });

  describe("createPayment", () => {
    it("should throw 404 if invoice not found initially", async () => {
      (paymentRepository.findInvoiceById as jest.Mock).mockResolvedValue(null);
      await expect(paymentService.createPayment("o1", "u1", { invoiceId: "inv1", amount: 100 } as any)).rejects.toThrow(ApiError);
    });

    it("should throw 404 if invoice not found in transaction", async () => {
      (paymentRepository.findInvoiceById as jest.Mock).mockResolvedValueOnce({ id: "inv1" }).mockResolvedValueOnce(null);
      await expect(paymentService.createPayment("o1", "u1", { invoiceId: "inv1", amount: 100 } as any)).rejects.toThrow(ApiError);
    });

    it("should create payment and update invoice status to PAID", async () => {
      (paymentRepository.findInvoiceById as jest.Mock).mockResolvedValue({ id: "inv1", invoiceNumber: "INV-001", totalAmount: 100 });
      (paymentRepository.createPaymentForOrganization as jest.Mock).mockResolvedValue({ id: "pay1" });
      (paymentRepository.sumPaymentsForInvoice as jest.Mock).mockResolvedValue({ _sum: { amount: 100 } });

      const result = await paymentService.createPayment("o1", "u1", { invoiceId: "inv1", amount: 100, paymentDate: "2026-01-01", paymentMethod: "CASH" } as any);

      expect(paymentRepository.createPaymentForOrganization).toHaveBeenCalled();
      expect(paymentRepository.updateInvoiceStatusForOrganization).toHaveBeenCalledWith(expect.any(Object), "o1", "inv1", "PAID");
      expect(paymentRepository.createFinancialTransaction).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(result.id).toBe("pay1");
    });

    it("should create payment and update invoice status to PARTIALLY_PAID", async () => {
      (paymentRepository.findInvoiceById as jest.Mock).mockResolvedValue({ id: "inv1", invoiceNumber: "INV-001", totalAmount: 100 });
      (paymentRepository.createPaymentForOrganization as jest.Mock).mockResolvedValue({ id: "pay1" });
      (paymentRepository.sumPaymentsForInvoice as jest.Mock).mockResolvedValue({ _sum: { amount: 50 } });

      await paymentService.createPayment("o1", "u1", { invoiceId: "inv1", amount: 50, paymentDate: "2026-01-01", paymentMethod: "CASH" } as any);

      expect(paymentRepository.updateInvoiceStatusForOrganization).toHaveBeenCalledWith(expect.any(Object), "o1", "inv1", "PARTIALLY_PAID");
    });
  });

  describe("listPayments", () => {
    it("should list payments", async () => {
      (paymentRepository.listPayments as jest.Mock).mockResolvedValue([{ id: "pay1" }]);
      const result = await paymentService.listPayments("o1", undefined, {});
      expect(result).toHaveLength(1);
    });
  });
});
