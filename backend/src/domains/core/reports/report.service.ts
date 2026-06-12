
import { reportRepository } from "./report.repository.js";
import { ReportRange } from "./report.types.js";

const resolveRange = (range: ReportRange) => ({
  startDate: range.startDate,
  endDate: range.endDate,
});

const salesReport = async (organizationId: string, range: ReportRange) => {
    const { startDate, endDate } = resolveRange(range);
    const agg = await reportRepository.aggregateInvoiceSales(
      organizationId,
      startDate,
      endDate,
    );

    const totalSales = Number(agg._sum.totalAmount ?? 0);
    const invoiceCount = agg._count._all;
    const averageInvoiceValue = invoiceCount ? totalSales / invoiceCount : 0;

    const grouped = await reportRepository.groupInvoiceSalesByCustomer(
      organizationId,
      startDate,
      endDate,
    );

    const topCustomerIds = grouped
      .sort(
        (a, b) =>
          Number(b._sum.totalAmount ?? 0) - Number(a._sum.totalAmount ?? 0),
      )
      .slice(0, 5)
      .map((entry) => entry.customerId);

    const customers = await reportRepository.findCustomersByIds(
      organizationId,
      topCustomerIds,
    );
    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer]),
    );

    const topCustomers = topCustomerIds.map((customerId) => {
      const record = grouped.find((entry) => entry.customerId === customerId)!;
      return {
        customer: customerMap.get(customerId),
        totalSales: Number(record._sum.totalAmount ?? 0),
        invoiceCount: record._count._all,
      };
    });

    const invoiceData = await reportRepository.listInvoiceDatesAndAmounts(
      organizationId,
      startDate,
      endDate,
    );

    const monthlyMap = new Map<string, number>();
    invoiceData.forEach((invoice) => {
      const date = invoice.issueDate;
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + Number(invoice.totalAmount));
    });
    const monthlySales = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    return {
      totalSales,
      invoiceCount,
      averageInvoiceValue,
      topCustomers,
      monthlySales,
    };
};

const expenseReport = async (organizationId: string, range: ReportRange) => {
    const { startDate, endDate } = resolveRange(range);
    const agg = await reportRepository.aggregateExpenses(
      organizationId,
      startDate,
      endDate,
    );

    const totalExpenses = Number(agg._sum.amount ?? 0);

    const byCategory = await reportRepository.groupExpensesByCategory(
      organizationId,
      startDate,
      endDate,
    );

    // Fetch minimal data for monthly grouping
    const expenseData = await reportRepository.listExpenseDatesAndAmounts(
      organizationId,
      startDate,
      endDate,
    );

    const monthlyMap = new Map<string, number>();
    expenseData.forEach((expense) => {
      const date = expense.expenseDate;
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + Number(expense.amount));
    });
    const monthlyExpenses = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    return {
      totalExpenses,
      expensesByCategory: byCategory.map((entry) => ({
        category: entry.category,
        total: Number(entry._sum.amount ?? 0),
      })),
      monthlyExpenses,
    };
};

const inventoryReport = async (organizationId: string) => {
    const stockValue = Number(await reportRepository.calculateStockValue(organizationId));

    const lowStockCandidates =
      await reportRepository.listLowStockCandidates(organizationId);
    const lowStockItems = lowStockCandidates.filter(
      (item) => item.reorderLevel !== null && Number(item.quantity) <= Number(item.reorderLevel),
    );

    const movements =
      await reportRepository.listRecentInventoryMovements(organizationId);

    return {
      stockValue,
      lowStockItems,
      movements,
    };
};

const taxReport = async (organizationId: string, range: ReportRange) => {
    const { startDate, endDate } = resolveRange(range);
    const totals = await reportRepository.aggregateInvoiceTaxAmount(
      organizationId,
      startDate,
      endDate,
    );

    const taxCollected = Number(totals._sum.taxAmount ?? 0);
    const taxPaid = 0;

    return {
      taxCollected,
      taxPaid,
      taxLiability: taxCollected - taxPaid,
    };
};

const dashboardMetrics = async (organizationId: string) => {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    const startOfPrevMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const endOfPrevMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999),
    );

    const startOfSixMonthsAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );

    const [
      salesSnapshot,
      expenseSnapshot,
      inventorySnapshot,
      prevSalesSnapshot,
      prevExpenseSnapshot,
      historicalSalesSnapshot,
      historicalExpenseSnapshot,
      taxSnapshot
    ] = await Promise.all([
      salesReport(organizationId, {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
      expenseReport(organizationId, {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
      inventoryReport(organizationId),
      salesReport(organizationId, {
        startDate: startOfPrevMonth.toISOString(),
        endDate: endOfPrevMonth.toISOString(),
      }),
      expenseReport(organizationId, {
        startDate: startOfPrevMonth.toISOString(),
        endDate: endOfPrevMonth.toISOString(),
      }),
      salesReport(organizationId, {
        startDate: startOfSixMonthsAgo.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
      expenseReport(organizationId, {
        startDate: startOfSixMonthsAgo.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
      taxReport(organizationId, {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
    ]);

    const unpaidInvoices =
      await reportRepository.countUnpaidInvoices(organizationId);

    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const currentProfit = salesSnapshot.totalSales - expenseSnapshot.totalExpenses;
    const prevProfit = prevSalesSnapshot.totalSales - prevExpenseSnapshot.totalExpenses;

    // Fill missing months for the last 6 months to ensure arrays are exactly 6 elements
    const historicalRevenue = [];
    const historicalExpenses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      
      const salesRecord = historicalSalesSnapshot.monthlySales.find(s => s.month === monthKey);
      historicalRevenue.push({ month: monthKey, total: salesRecord?.total || 0 });

      const expenseRecord = historicalExpenseSnapshot.monthlyExpenses.find(e => e.month === monthKey);
      historicalExpenses.push({ month: monthKey, total: expenseRecord?.total || 0 });
    }

    return {
      monthlyRevenue: salesSnapshot.totalSales,
      monthlyExpenses: expenseSnapshot.totalExpenses,
      profitEstimate: currentProfit,
      unpaidInvoices,
      inventoryValue: inventorySnapshot.stockValue,
      topCustomers: salesSnapshot.topCustomers,
      revenueTrend: calcTrend(salesSnapshot.totalSales, prevSalesSnapshot.totalSales),
      expensesTrend: calcTrend(expenseSnapshot.totalExpenses, prevExpenseSnapshot.totalExpenses),
      profitTrend: calcTrend(currentProfit, prevProfit),
      historicalRevenue,
      historicalExpenses,
      expensesByCategory: expenseSnapshot.expensesByCategory,
      taxCollected: taxSnapshot.taxCollected,
      taxTrend: calcTrend(taxSnapshot.taxCollected, 0) // No previous month tax calculated here, so trend is basic
    };
};

export const reportService = {
  salesReport,
  expenseReport,
  inventoryReport,
  taxReport,
  dashboardMetrics,
};
