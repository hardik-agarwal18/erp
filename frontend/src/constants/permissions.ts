import type { FeatureKey } from "@/types/app";

export const featurePermissions: Record<FeatureKey, string[]> = {
  dashboard: ["reports.view"],
  customers: ["customers.view"],
  vendors: ["vendors.view"],
  invoices: ["sales.view"],
  inventory: ["inventory.view"],
  purchases: ["purchasing.view"],
  products: ["products.view"],
  transactions: ["finance.view"],
  expenses: ["purchasing.view"],
  payments: ["finance.view", "sales.view"],
  reports: ["reports.view"],
  organizations: ["organization.view", "organization.settings"],
  audit_logs: ["audit.read"],
};
