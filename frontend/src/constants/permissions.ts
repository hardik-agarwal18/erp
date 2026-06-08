import type { FeatureKey } from "@/types/app";

export const featurePermissions: Record<FeatureKey, string[]> = {
  dashboard: ["reports.view"],
  customers: ["customers.view", "customers.create", "customers.update"],
  vendors: ["vendors.view", "vendors.create", "vendors.update"],
  invoices: ["invoices.view", "invoices.create", "invoices.update"],
  inventory: ["inventory.manage"],
  purchases: ["expenses.manage"],
  products: ["products.manage"],
  transactions: ["transactions.view"],
  expenses: ["expenses.manage"],
  payments: ["invoices.manage"], // Using invoices.manage for payments initially
  reports: ["reports.view"],
  organizations: ["organizations.manage"],
  audit_logs: ["audit_logs.view"],
};
