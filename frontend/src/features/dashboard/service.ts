import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { DashboardSnapshot } from "@/types/app";

type DashboardReport = {
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitEstimate: number;
  unpaidInvoices: number;
  inventoryValue: number;
  revenueTrend: number;
  expensesTrend: number;
  profitTrend: number;
  historicalRevenue: Array<{ month: string; total: number }>;
  historicalExpenses: Array<{ month: string; total: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  taxCollected: number;
  taxTrend: number;
  topCustomers: Array<{
    customer: { id: string; name: string } | null;
    totalSales: number;
    invoiceCount: number;
  }>;
};

type InventoryReport = {
  stockValue: number;
  lowStockItems: Array<{
    id: string;
    quantity: number;
    reorderLevel: number | null;
    product: { id: string; name: string; sku: string | null };
  }>;
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    createdAt: string;
    product: { id: string; name: string; sku: string | null };
  }>;
};

type SalesReport = {
  totalSales: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  topCustomers: Array<{
    customer: { id: string; name: string } | null;
    totalSales: number;
    invoiceCount: number;
  }>;
};

export async function getDashboardSnapshot() {
  const [dashboardResponse, inventoryResponse, salesResponse] = await Promise.all([
    apiClient.get<ApiResponse<DashboardReport>>(apiEndpoints.reports.dashboard),
    apiClient.get<ApiResponse<InventoryReport>>(apiEndpoints.reports.inventory),
    apiClient.get<ApiResponse<SalesReport>>(apiEndpoints.reports.sales),
  ]);

  const dashboard = dashboardResponse.data.data;
  const inventory = inventoryResponse.data.data;
  const sales = salesResponse.data.data;

  const snapshot: DashboardSnapshot = {
    kpis: [
      { label: "Revenue", value: dashboard.monthlyRevenue, trend: dashboard.revenueTrend, detail: "Current month sales from backend reports." },
      { label: "Expenses", value: dashboard.monthlyExpenses, trend: dashboard.expensesTrend, detail: "Current month expenses from backend reports." },
      { label: "Profit", value: dashboard.profitEstimate, trend: dashboard.profitTrend, detail: "Revenue less expenses for the current month." },
      { label: "Tax Collected", value: dashboard.taxCollected, trend: dashboard.taxTrend, detail: "Taxes collected on issued invoices." },
      { label: "Unpaid Invoices", value: dashboard.unpaidInvoices, trend: undefined, detail: "Open issued invoices requiring follow-up." },
      { label: "Inventory Value", value: dashboard.inventoryValue, trend: undefined, detail: "Inventory valuation from backend stock report." },
      { label: "Avg Invoice", value: sales.averageInvoiceValue, trend: undefined, detail: "Average invoice value in the selected report range." },
    ],
    revenueTrend: dashboard.historicalRevenue.map(h => ({
      month: h.month,
      revenue: h.total,
      forecast: 0,
    })),
    expenseTrend: dashboard.historicalExpenses.map(h => ({
      month: h.month,
      expenses: h.total,
      payroll: 0,
    })),
    cashFlowTrend: dashboard.historicalRevenue.map((r, i) => {
      const expenses = dashboard.historicalExpenses[i]?.total || 0;
      return {
        month: r.month,
        inflow: r.total,
        outflow: expenses,
        net: r.total - expenses,
      };
    }),
    bankBalances: [{ label: "Operating Position", amount: dashboard.profitEstimate }],
    receivablesVsPayables: [
      { label: "Receivables", amount: dashboard.monthlyRevenue },
      { label: "Payables", amount: dashboard.monthlyExpenses },
    ],
    activity: inventory.movements.slice(0, 5).map((movement) => ({
      id: movement.id,
      title: `${movement.product.name} ${movement.type.toLowerCase()}`,
      detail: `Quantity ${movement.quantity} recorded in inventory movement log.`,
      time: movement.createdAt.slice(0, 10),
      kind: "inventory" as const,
    })),
    lowStockAlerts: inventory.lowStockItems.map((item) => ({
      id: item.id,
      item: item.product.name,
      sku: item.product.sku ?? "",
      warehouse: "Primary",
      remaining: Number(item.quantity),
      severity: item.reorderLevel && Number(item.quantity) <= item.reorderLevel / 2 ? ("critical" as const) : ("warning" as const),
    })),
    outstandingInvoices: dashboard.topCustomers.map((entry) => ({
      id: entry.customer?.id ?? String(entry.totalSales),
      customer: entry.customer?.name ?? "Unknown customer",
      dueDate: "Open balance",
      amount: entry.totalSales,
      status: "due_soon" as const,
    })),
    expensesByCategory: dashboard.expensesByCategory,
    topCustomers: dashboard.topCustomers.map(tc => ({
      customer: tc.customer?.name || "Unknown",
      revenue: tc.totalSales,
    })),
  };

  return snapshot;
}
