import { jest } from "@jest/globals";

// Mocking dependencies
import { reportRepository } from "../../../src/modules/reports/report.repository.js";

jest.mock("../../../src/modules/reports/report.repository.js");

import { reportService } from "../../../src/modules/reports/report.service.js";

describe("reportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("salesReport", () => {
    it("should return sales report", async () => {
      (reportRepository.aggregateInvoiceSales as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 1000 }, _count: { _all: 5 } });
      (reportRepository.groupInvoiceSalesByCustomer as jest.Mock).mockResolvedValue([
        { customerId: "c1", _sum: { totalAmount: 1000 }, _count: { _all: 5 } }
      ]);
      (reportRepository.findCustomersByIds as jest.Mock).mockResolvedValue([{ id: "c1", name: "Test Cust" }]);
      (reportRepository.listInvoiceDatesAndAmounts as jest.Mock).mockResolvedValue([
        { issueDate: new Date("2026-01-15T00:00:00Z"), totalAmount: 1000 }
      ]);

      const result = await reportService.salesReport("o1", {});
      expect(result.totalSales).toBe(1000);
      expect(result.invoiceCount).toBe(5);
      expect(result.topCustomers[0].customer.name).toBe("Test Cust");
    });
  });

  describe("expenseReport", () => {
    it("should return expense report", async () => {
      (reportRepository.aggregateExpenses as jest.Mock).mockResolvedValue({ _sum: { amount: 500 } });
      (reportRepository.groupExpensesByCategory as jest.Mock).mockResolvedValue([
        { category: "Meals", _sum: { amount: 500 } }
      ]);
      (reportRepository.listExpenseDatesAndAmounts as jest.Mock).mockResolvedValue([
        { expenseDate: new Date("2026-01-15T00:00:00Z"), amount: 500 }
      ]);

      const result = await reportService.expenseReport("o1", {});
      expect(result.totalExpenses).toBe(500);
      expect(result.expensesByCategory[0].category).toBe("Meals");
      expect(result.monthlyExpenses[0].month).toBe("2026-01");
      expect(result.monthlyExpenses[0].total).toBe(500);
    });
  });

  describe("inventoryReport", () => {
    it("should return inventory report", async () => {
      (reportRepository.calculateStockValue as jest.Mock).mockResolvedValue(2000);
      (reportRepository.listLowStockCandidates as jest.Mock).mockResolvedValue([
        { id: "i1", quantity: 5, reorderLevel: 10 }
      ]);
      (reportRepository.listRecentInventoryMovements as jest.Mock).mockResolvedValue([]);

      const result = await reportService.inventoryReport("o1");
      expect(result.stockValue).toBe(2000);
      expect(result.lowStockItems).toHaveLength(1);
    });
  });

  describe("taxReport", () => {
    it("should return tax report", async () => {
      (reportRepository.aggregateInvoiceTaxAmount as jest.Mock).mockResolvedValue({ _sum: { taxAmount: 150 } });

      const result = await reportService.taxReport("o1", {});
      expect(result.taxCollected).toBe(150);
      expect(result.taxLiability).toBe(150);
    });
  });

  describe("dashboardMetrics", () => {
    it("should return dashboard metrics", async () => {
      // Setup all mocks needed for dashboard metrics
      (reportRepository.aggregateInvoiceSales as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 1000 }, _count: { _all: 5 } });
      (reportRepository.groupInvoiceSalesByCustomer as jest.Mock).mockResolvedValue([]);
      (reportRepository.findCustomersByIds as jest.Mock).mockResolvedValue([]);
      (reportRepository.listInvoiceDatesAndAmounts as jest.Mock).mockResolvedValue([]);
      
      (reportRepository.aggregateExpenses as jest.Mock).mockResolvedValue({ _sum: { amount: 500 } });
      (reportRepository.groupExpensesByCategory as jest.Mock).mockResolvedValue([]);
      (reportRepository.listExpenseDatesAndAmounts as jest.Mock).mockResolvedValue([]);
      
      (reportRepository.calculateStockValue as jest.Mock).mockResolvedValue(2000);
      (reportRepository.listLowStockCandidates as jest.Mock).mockResolvedValue([]);
      (reportRepository.listRecentInventoryMovements as jest.Mock).mockResolvedValue([]);

      (reportRepository.countUnpaidInvoices as jest.Mock).mockResolvedValue(3);

      const result = await reportService.dashboardMetrics("o1");
      expect(result.monthlyRevenue).toBe(1000);
      expect(result.monthlyExpenses).toBe(500);
      expect(result.profitEstimate).toBe(500);
      expect(result.unpaidInvoices).toBe(3);
      expect(result.inventoryValue).toBe(2000);
    });
  });
});
