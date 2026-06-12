// @ts-nocheck
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || "300", 10),
  DASHBOARD_TTL: parseInt(process.env.CACHE_DASHBOARD_TTL || "60", 10),
  REPORT_TTL: parseInt(process.env.CACHE_REPORT_TTL || "900", 10),
  ENABLED: process.env.CACHE_ENABLED !== "false",
};

export const CACHE_DOMAINS = {
  INVENTORY: "inventory",
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  VENDORS: "vendors",
  ACCOUNTING_REPORTS: "accounting-reports",
  DASHBOARD: "dashboard",
  PERMISSIONS: "permissions",
  ROLES: "roles",
  ORGANIZATIONS: "organizations",
};
