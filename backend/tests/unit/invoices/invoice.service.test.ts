import { jest } from "@jest/globals";

// Mocking dependencies
import { invoiceRepository } from "../../../src/domains/financials/invoices/invoice.repository.js";
import { auditService } from "../../../src/services/audit/index.js";
import { pdfGenerationQueue } from "../../../src/queue/queue.service.js";

jest.mock("../../../src/domains/financials/invoices/invoice.repository.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    INVOICE_CREATED: "invoice.created",
    INVOICE_UPDATED: "invoice.updated",
  },
  AUDIT_ENTITY_TYPES: {
    INVOICE: "invoice",
  },
  auditService: {
    record: jest.fn(),
  }
}));
jest.mock("../../../src/queue/queue.service.js", () => ({
  pdfGenerationQueue: {
    add: jest.fn(),
  },
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    invoiceSequence: { upsert: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
    },
  };
});

import { invoiceService } from "../../../src/domains/financials/invoices/invoice.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("invoiceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockTx = {
        invoiceSequence: { upsert: jest.fn().mockResolvedValue({ prefix: "INV", nextNumber: 3 }) },
      };
      return cb(mockTx);
    });
  });

  describe("createInvoice", () => {
    it("should throw 404 if customer not found", async () => {
      (invoiceRepository.findCustomerById as jest.Mock).mockResolvedValue(null);
      await expect(invoiceService.createInvoice("o1", "u1", { customerId: "c1", items: [] } as any)).rejects.toThrow(ApiError);
    });

    it("should throw 400 if products not found", async () => {
      (invoiceRepository.findCustomerById as jest.Mock).mockResolvedValue({ id: "c1" });
      (invoiceRepository.findProductsByIds as jest.Mock).mockResolvedValue([]);
      await expect(invoiceService.createInvoice("o1", "u1", { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] } as any)).rejects.toThrow(ApiError);
    });

    it("should create DRAFT invoice", async () => {
      (invoiceRepository.findCustomerById as jest.Mock).mockResolvedValue({ id: "c1" });
      (invoiceRepository.findProductsByIds as jest.Mock).mockResolvedValue([{ id: "p1", sellingPrice: 10, type: "SERVICE", tax: null }]);
      (invoiceRepository.createInvoiceWithItems as jest.Mock).mockResolvedValue({ id: "inv1" });
      (invoiceRepository.findById as jest.Mock).mockResolvedValue({ id: "inv1", status: "DRAFT" });

      const result = await invoiceService.createInvoice("o1", "u1", {
        customerId: "c1",
        issueDate: "2026-01-01",
        status: "DRAFT",
        items: [{ productId: "p1", quantity: 2 }]
      } as any);

      expect(invoiceRepository.createInvoiceWithItems).toHaveBeenCalled();
      expect(invoiceRepository.createFinancialTransaction).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
      expect(pdfGenerationQueue.add).not.toHaveBeenCalled();
      expect(result.id).toBe("inv1");
    });

    it("should create ISSUED invoice and add to queue", async () => {
      (invoiceRepository.findCustomerById as jest.Mock).mockResolvedValue({ id: "c1" });
      (invoiceRepository.findProductsByIds as jest.Mock).mockResolvedValue([{ id: "p1", sellingPrice: 10, type: "SERVICE", tax: null }]);
      (invoiceRepository.createInvoiceWithItems as jest.Mock).mockResolvedValue({ id: "inv1" });
      (invoiceRepository.findById as jest.Mock).mockResolvedValue({ id: "inv1", status: "ISSUED" });

      await invoiceService.createInvoice("o1", "u1", {
        customerId: "c1",
        issueDate: "2026-01-01",
        status: "ISSUED",
        items: [{ productId: "p1", quantity: 2 }]
      } as any);

      expect(pdfGenerationQueue.add).toHaveBeenCalledWith("generate-invoice-pdf", expect.any(Object));
    });

    it("should deduct inventory if product is physical and invoice is ISSUED", async () => {
      (invoiceRepository.findCustomerById as jest.Mock).mockResolvedValue({ id: "c1" });
      (invoiceRepository.findProductsByIds as jest.Mock).mockResolvedValue([{ id: "p1", sellingPrice: 10, type: "PHYSICAL", tax: null }]);
      (invoiceRepository.createInvoiceWithItems as jest.Mock).mockResolvedValue({ id: "inv1" });
      (invoiceRepository.findInventoryItemForProduct as jest.Mock).mockResolvedValue({ id: "invItem1", quantity: 10 });
      (invoiceRepository.findById as jest.Mock).mockResolvedValue({ id: "inv1", status: "ISSUED" });

      await invoiceService.createInvoice("o1", "u1", {
        customerId: "c1",
        issueDate: "2026-01-01",
        status: "ISSUED",
        items: [{ productId: "p1", quantity: 2 }]
      } as any);

      expect(invoiceRepository.findInventoryItemForProduct).toHaveBeenCalled();
      expect(invoiceRepository.decrementInventoryItem).toHaveBeenCalled();
      expect(invoiceRepository.createInventoryMovement).toHaveBeenCalled();
    });
  });

  describe("updateInvoice", () => {
    it("should throw 404 if invoice not found", async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(invoiceService.updateInvoice("o1", "u1", "inv1", {})).rejects.toThrow(ApiError);
    });

    it("should update invoice status to ISSUED and trigger inventory deductions", async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue({ id: "inv1", status: "DRAFT" });
      (invoiceRepository.updateInvoiceForOrganization as jest.Mock).mockResolvedValue({ count: 1 });
      (invoiceRepository.listInvoiceItems as jest.Mock).mockResolvedValue([{ productId: "p1", quantity: 2, product: { type: "PHYSICAL" } }]);
      (invoiceRepository.findInventoryItemForProduct as jest.Mock).mockResolvedValue({ id: "invItem1", quantity: 10 });

      await invoiceService.updateInvoice("o1", "u1", "inv1", { status: "ISSUED" });

      expect(invoiceRepository.decrementInventoryItem).toHaveBeenCalled();
      expect(pdfGenerationQueue.add).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listInvoices", () => {
    it("should list invoices", async () => {
      (invoiceRepository.listInvoices as jest.Mock).mockResolvedValue([{ id: "inv1" }]);
      const result = await invoiceService.listInvoices("o1", {}, {});
      expect(result).toHaveLength(1);
    });
  });

  describe("getInvoice", () => {
    it("should get invoice", async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue({ id: "inv1" });
      const result = await invoiceService.getInvoice("o1", "inv1");
      expect(result.id).toBe("inv1");
    });
  });
});
